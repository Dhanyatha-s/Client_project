"""
api.py
Flask REST API — slices .h5 ECG data and serves it to the React frontend.

Endpoints
─────────
GET  /api/patients                              list all patients
GET  /api/patients/<id>                         single patient record
GET  /api/ecg/<patient_id>/<leads>              slice one lead
     ?lead=II&start=0&duration=10
GET  /api/ecg/<patient_id>/<leads>/all          all leads for window
     ?start=0&duration=10
GET  /health

Run:
    pip install flask flask-cors h5py numpy
    python api.py
"""

"""
api.py  —  Holter ECG REST API  (v7 compatible — dynamic lead detection)
"""

import os, glob, logging
from functools import lru_cache

import h5py
import numpy as np
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

from database import initialize_database, fetch_all_patients, fetch_patient, \
                     upsert_patient_files

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── Auto-detect data directory ────────────────────────────────────────────────
def _find_data_dir():
    candidates = [
        os.environ.get("ECG_DATA_DIR", ""),
        os.path.join(os.path.dirname(__file__), "..", "data"),  # project root/data
        os.path.join(os.path.dirname(__file__), "data"),         # backend/data
        os.path.dirname(__file__),
    ]
    for c in candidates:
        c = os.path.normpath(c)
        if c and os.path.isdir(c) and glob.glob(os.path.join(c, "*.h5")):
            log.info(f"DATA_DIR → {c}  ({len(glob.glob(os.path.join(c,'*.h5')))} .h5 files)")
            return c
    fallback = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data"))
    log.warning(f"No .h5 files found — watching: {fallback}")
    return fallback

DATA_DIR = _find_data_dir()
PORT     = int(os.environ.get("PORT", 5000))

# ── Standard lead names by column count ──────────────────────────────────────
STANDARD_LEAD_NAMES = {
    1:  ["II"],
    2:  ["I", "II"],
    3:  ["I", "II", "V2"],
    4:  ["I", "II", "III", "V2"],
    5:  ["I", "II", "III", "aVR", "V2"],
    6:  ["I", "II", "III", "aVR", "aVL", "aVF"],
    7:  ["I", "II", "III", "aVR", "aVL", "aVF", "V1"],
    8:  ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2"],
    9:  ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3"],
    10: ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4"],
    11: ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5"],
    12: ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"],
}

# ── H5 handle cache ───────────────────────────────────────────────────────────
_h5_cache = {}

def _open_h5(path):
    path = os.path.normpath(path)
    if path not in _h5_cache:
        if not os.path.exists(path):
            log.warning(f"H5 not found: {path}")
            return None
        try:
            _h5_cache[path] = h5py.File(path, "r")
            log.info(f"Opened: {path}  shape={_h5_cache[path]['ecg'].shape}")
        except Exception as e:
            log.error(f"Cannot open {path}: {e}")
            return None
    return _h5_cache[path]

def _get_lead_names(fh):
    """Read lead names from H5 metadata, or infer from column count."""
    import json
    try:
        raw = fh.attrs.get("lead_names")
        if raw is None:
            try: raw = fh["metadata"].attrs.get("lead_names")
            except: pass
        if raw:
            names = json.loads(raw) if isinstance(raw, str) else list(raw)
            if isinstance(names, list) and len(names) == fh["ecg"].shape[1]:
                return [str(n) for n in names]
    except Exception:
        pass
    n = int(fh["ecg"].shape[1])
    return STANDARD_LEAD_NAMES.get(n, [f"Ch{i+1}" for i in range(n)])

def _best_h5_for_patient(patient_id):
    """
    Return (fh, lead_names, patient_dict).
    Tries DB entry first, then scans DATA_DIR for best match.
    """
    patient = fetch_patient(patient_id)

    if patient:
        # Try 12-lead first, then 3-lead
        for key in ("h5_12lead", "h5_3lead"):
            fname = patient.get(key, "")
            if fname:
                fh = _open_h5(os.path.join(DATA_DIR, fname))
                if fh is not None:
                    return fh, _get_lead_names(fh), patient

    # Fallback: scan DATA_DIR and pick file with most leads
    best_fh, best_names = None, []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith(".h5"):
            continue
        fh = _open_h5(os.path.join(DATA_DIR, fname))
        if fh is None:
            continue
        names = _get_lead_names(fh)
        if len(names) > len(best_names):
            best_fh, best_names = fh, names

    if best_fh:
        log.info(f"Auto-selected {len(best_names)}-lead file for {patient_id}")
    return best_fh, best_names, patient or {"id": patient_id, "name": patient_id}

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.get("/health")
def health():
    h5_files = glob.glob(os.path.join(DATA_DIR, "*.h5"))
    return jsonify({
        "status":   "ok",
        "data_dir": DATA_DIR,
        "h5_files": [os.path.basename(f) for f in h5_files],
    })

@app.get("/api/files")
def list_files():
    """Scan DATA_DIR and return every .h5 file with metadata."""
    results = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith(".h5"):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        fh    = _open_h5(fpath)
        if fh is None:
            continue
        names  = _get_lead_names(fh)
        shape  = fh["ecg"].shape
        sr     = int(fh.attrs.get("sampling_rate", 250))
        dur_hr = shape[0] / sr / 3600
        results.append({
            "filename":    fname,
            "n_leads":     len(names),
            "lead_names":  names,
            "sr":          sr,
            "total_samples": int(shape[0]),
            "duration_hr": round(dur_hr, 3),
            "size_mb":     round(os.path.getsize(fpath) / 1024 / 1024, 1),
        })
    return jsonify(results)

@app.get("/api/patients")
def list_patients():
    return jsonify(fetch_all_patients())

@app.get("/api/patients/<patient_id>")
def get_patient(patient_id):
    p = fetch_patient(patient_id)
    if not p:
        abort(404, f"Patient {patient_id} not found")
    return jsonify(p)

# ── DYNAMIC ECG ENDPOINT (v7 frontend calls this) ─────────────────────────────
@app.get("/api/ecg/<patient_id>")
def get_ecg_dynamic(patient_id):
    """
    Main endpoint — auto-detects leads from H5 file.
    Called by v7 useEcgData hook: /api/ecg/P001?start=0&duration=30
    Returns lead_names so the frontend can drive layout dynamically.
    """
    start    = float(request.args.get("start", 0))
    duration = min(float(request.args.get("duration", 10)), 30.0)

    fh, lead_names, _ = _best_h5_for_patient(patient_id)
    if fh is None:
        available = [f for f in os.listdir(DATA_DIR) if f.endswith(".h5")]
        return jsonify({
            "error":     f"No H5 file found for {patient_id}",
            "data_dir":  DATA_DIR,
            "available": available,
        }), 404

    sr    = int(fh.attrs.get("sampling_rate", 250))
    total = int(fh["ecg"].shape[0])
    s     = max(0, int(start * sr))
    e     = min(s + int(duration * sr), total)

    if s >= total:
        return jsonify({"error": f"start={start}s beyond recording"}), 400

    block     = fh["ecg"][s:e, :]
    leads_out = {}
    for i, name in enumerate(lead_names):
        if i < block.shape[1]:
            leads_out[name] = block[:, i].tolist()

    log.info(f"ECG {patient_id} leads={lead_names} t=[{start:.1f},{start+duration:.1f}]s")
    return jsonify({
        "patient_id": patient_id,
        "lead_names": lead_names,       # frontend reads this to drive layout
        "n_leads":    len(lead_names),
        "sr":         sr,
        "start":      start,
        "duration":   duration,
        "total_sec":  total / sr,
        "leads":      leads_out,
    })

# ── LEGACY ENDPOINTS (keep for backward compat) ───────────────────────────────
@app.get("/api/ecg/<patient_id>/<int:n_leads>/all")
def get_all_leads_legacy(patient_id, n_leads):
    start    = float(request.args.get("start", 0))
    duration = min(float(request.args.get("duration", 10)), 30.0)
    fh, lead_names, _ = _best_h5_for_patient(patient_id)
    if fh is None:
        abort(404)
    sr    = int(fh.attrs.get("sampling_rate", 250))
    total = int(fh["ecg"].shape[0])
    s     = max(0, int(start * sr))
    e     = min(s + int(duration * sr), total)
    block = fh["ecg"][s:e, :]
    leads_out = {name: block[:, i].tolist()
                 for i, name in enumerate(lead_names) if i < block.shape[1]}
    return jsonify({
        "n_leads": len(lead_names), "lead_names": lead_names,
        "sr": sr, "start": start, "duration": duration,
        "total_sec": total / sr, "leads": leads_out,
    })

@app.get("/api/ecg/<patient_id>/<int:n_leads>")
def get_single_lead_legacy(patient_id, n_leads):
    lead     = request.args.get("lead", "II")
    start    = float(request.args.get("start", 0))
    duration = min(float(request.args.get("duration", 10)), 60.0)
    fh, lead_names, _ = _best_h5_for_patient(patient_id)
    if fh is None:
        abort(404)
    if lead not in lead_names:
        abort(400, f"Lead '{lead}' not in file. Available: {lead_names}")
    col   = lead_names.index(lead)
    sr    = int(fh.attrs.get("sampling_rate", 250))
    total = int(fh["ecg"].shape[0])
    s, e  = int(start * sr), min(int(start * sr) + int(duration * sr), total)
    return jsonify({"lead": lead, "sr": sr, "start": start,
                    "samples": fh["ecg"][s:e, col].tolist()})

# ── Boot ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    initialize_database()

    h5_files = glob.glob(os.path.join(DATA_DIR, "*.h5"))
    if h5_files:
        log.info(f"Auto-registering {len(h5_files)} .h5 files...")
        upsert_patient_files(DATA_DIR, h5_files)
    else:
        log.warning("No .h5 files found in data/ — run storage.py first")

    log.info(f"ECG API → http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)