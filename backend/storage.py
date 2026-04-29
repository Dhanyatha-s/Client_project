"""
storage.py
Converts .npy memmap files → compressed HDF5 WITHOUT loading full data into RAM.
Run once to produce the .h5 files that the API server reads.

Usage:
    python storage.py
"""

import os
import numpy as np
import h5py

# ── Must match simulate.py exactly ──────────────────────────────────────────
SAMPLING_RATE  = 250
TOTAL_DURATION = 172800          # 48 hr in seconds
TOTAL_SAMPLES  = SAMPLING_RATE * TOTAL_DURATION  # 43 200 000

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def convert_memmap_to_h5(npy_path: str, h5_path: str, num_leads: int):
    """
    Stream-copy from memory-mapped .npy → chunked, gzip-compressed HDF5.
    Peak RAM usage ≈ chunk_size × num_leads × 4 bytes ≈ ~0.2 MB.
    """
    print(f"\n  Processing : {os.path.basename(npy_path)}")

    data = np.memmap(
        npy_path,
        dtype="float32",
        mode="r",
        shape=(TOTAL_SAMPLES, num_leads),
    )

    with h5py.File(h5_path, "w") as f:
        dset = f.create_dataset(
            "ecg",
            shape=(TOTAL_SAMPLES, num_leads),
            dtype="float32",
            chunks=(5000, num_leads),    # 5000-sample chunks → good streaming granularity
            compression="gzip",
            compression_opts=4,
        )

        chunk_size = 5_000
        for i in range(0, TOTAL_SAMPLES, chunk_size):
            dset[i : i + chunk_size] = data[i : i + chunk_size]
            if i % (chunk_size * 200) == 0:
                pct = i / TOTAL_SAMPLES * 100
                print(f"    {pct:5.1f}%  ({i:,} / {TOTAL_SAMPLES:,})")

        # Store metadata so the API can read it without knowing constants
        f.attrs["sampling_rate"] = SAMPLING_RATE
        f.attrs["num_leads"]     = num_leads
        f.attrs["total_samples"] = TOTAL_SAMPLES
        f.attrs["duration_sec"]  = float(TOTAL_DURATION)

    print(f"  Saved → {os.path.basename(h5_path)}")
    _compare_sizes(npy_path, h5_path)


def _compare_sizes(npy_path: str, h5_path: str):
    npy_mb = os.path.getsize(npy_path) / 1024 / 1024
    h5_mb  = os.path.getsize(h5_path)  / 1024 / 1024
    print(f"  Size  : {npy_mb:.1f} MB  →  {h5_mb:.1f} MB  "
          f"(saved {npy_mb - h5_mb:.1f} MB, "
          f"{(1 - h5_mb/npy_mb)*100:.0f}% smaller)")


def main():
    npy_3  = os.path.join(DATA_DIR, "ecg_48hr_3leads.npy")
    npy_12 = os.path.join(DATA_DIR, "ecg_48hr_12leads.npy")
    h5_3   = os.path.join(DATA_DIR, "ecg_48hr_3leads_converted.h5")
    h5_12  = os.path.join(DATA_DIR, "ecg_48hr_12leads_converted.h5")

    print("Starting conversion — original .npy files are NOT modified")

    convert_memmap_to_h5(npy_3,  h5_3,  num_leads=3)
    convert_memmap_to_h5(npy_12, h5_12, num_leads=12)

    print("\nDone — originals untouched, .h5 files ready for API server")


if __name__ == "__main__":
    main()
