"""
database.py
Initialises SQLite patient records and provides query helpers.
"""

"""
database.py  —  SQLite patient store
"""

import os, glob, logging, sqlite3

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "holter.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id         TEXT PRIMARY KEY,
                name       TEXT NOT NULL,
                age        INTEGER DEFAULT 0,
                sex        TEXT    DEFAULT 'M',
                dob        TEXT    DEFAULT '',
                created_at TEXT    DEFAULT '',
                h5_3lead   TEXT    DEFAULT '',
                h5_12lead  TEXT    DEFAULT ''
            )
        """)
        # P001 — 12-lead patient
        conn.execute("""
            INSERT OR IGNORE INTO patients
              (id, name, age, sex, dob, created_at, h5_3lead, h5_12lead)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            "P001", "Test Patient", 45, "M", "1981-01-01", "2026-01-01",
            "ecg_48hr_3leads_converted.h5",
            "ecg_48hr_12leads_converted.h5",
        ))
        # P002 — 3-lead patient (second patient to test dynamic layout)
        conn.execute("""
            INSERT OR IGNORE INTO patients
              (id, name, age, sex, dob, created_at, h5_3lead, h5_12lead)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            "P002", "Arjun Sharma", 62, "M", "1964-05-20", "2026-01-15",
            "ecg_48hr_3leads_converted.h5",
            "",
        ))
        conn.commit()
    log.info("Database ready.")


def upsert_patient_files(data_dir: str, h5_paths: list):
    """
    Scan h5_paths, figure out 3-lead vs 12-lead by shape[1],
    and update P001 DB record. Does NOT overwrite P002's h5_3lead
    since P002 is intentionally 3-lead only.
    """
    import h5py
    mapping = {"h5_3lead": "", "h5_12lead": ""}

    for path in h5_paths:
        fname = os.path.basename(path)
        try:
            with h5py.File(path, "r") as f:
                n = int(f["ecg"].shape[1])
            if n == 3:
                mapping["h5_3lead"] = fname
                log.info(f"  3-lead  file : {fname}")
            elif n == 12:
                mapping["h5_12lead"] = fname
                log.info(f"  12-lead file : {fname}")
        except Exception as e:
            log.warning(f"  Skipping {fname}: {e}")

    with get_conn() as conn:
        # Update P001 with both files
        if mapping["h5_12lead"]:
            conn.execute(
                "UPDATE patients SET h5_12lead=?, h5_3lead=? WHERE id='P001'",
                (mapping["h5_12lead"], mapping["h5_3lead"])
            )
        # P002 keeps only the 3-lead file (already seeded above)
        conn.commit()
    log.info(f"DB updated → P001: 12L={mapping['h5_12lead']} 3L={mapping['h5_3lead']}")


def fetch_all_patients():
    with get_conn() as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM patients").fetchall()]


def fetch_patient(pid: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
        return dict(row) if row else None


if __name__ == "__main__":
    initialize_database()
    for p in fetch_all_patients():
        print(p)