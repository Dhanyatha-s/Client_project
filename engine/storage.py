# import os
# import numpy as np
# import h5py

# def save_ecg_signals_to_h5(path, sampling_rate):
#     """
#     Scans a directory for .npy files and converts them to .h5 format.
#     """
#     # Check if directory exists before starting
#     if not os.path.exists(data_dir):
#         print(f"Error: The directory '{data_dir}' does not exist.")
#         return

#     for file in os.listdir(data_dir):
#         if file.endswith('.npy'):
#             load_path = os.path.join(data_dir, file)
#             save_path = os.path.join(data_dir, file.replace('.npy', '.h5'))
            
#             try:
#                 # Load the signal
#                 signal = np.load(load_path)
                
#                 # Save as .h5
#                 with h5py.File(save_path, 'w') as f:
#                     # Note: chunks must be a tuple (2500,)
#                     f.create_dataset('lead_l', data=signal, chunks=(2500,), 
#                                      compression='gzip', compression_opts=4)
                    
#                     f.attrs['sampling_rate'] = sampling_rate
                
#                 print(f"Successfully converted: {file} -> {os.path.basename(save_path)}")
            
#             except Exception as e:
#                 print(f"Failed to convert {file}: {e}")

# if __name__ == "__main__":
#     # Define  configuration parameters
#     DATA_DIR = r'C:\Users\DHANYATHA\OneDrive\Documents\Holter Monitor Analytical System\Holter-Monitor-Analytical-System\data\ecg_48hr_3leads.npy'  
#     SAMPLING_RATE = 250   # Change this to  actual sampling rate (e.g., 250Hz, 500Hz)

#     print(f"Starting conversion in: {DATA_DIR}...")
#     save_ecg_signals_to_h5(DATA_DIR, SAMPLING_RATE)
#     print("Done!")


import os
import numpy as np
import h5py


# SAME CONFIG (must match generator exactly)
SAMPLING_RATE = 250
TOTAL_DURATION = 172800  # 48 hr
TOTAL_SAMPLES = SAMPLING_RATE * TOTAL_DURATION


def convert_memmap_to_h5(npy_path, h5_path, num_leads):
    """
    Convert raw memmap (.npy in your case) → HDF5
    WITHOUT loading entire file into RAM
    """

    print(f"\n📥 Processing: {npy_path}")

    # ✅ Read as memmap (NOT np.load)
    data = np.memmap(
        npy_path,
        dtype="float32",
        mode="r",
        shape=(TOTAL_SAMPLES, num_leads)
    )

    print("💾 Writing to HDF5...")

    with h5py.File(h5_path, "w") as f:
        dset = f.create_dataset(
            "ecg",
            shape=(TOTAL_SAMPLES, num_leads),
            dtype="float32",
            chunks=(5000, num_leads),   # better chunk for streaming
            compression="gzip",
            compression_opts=4
        )

        # ✅ Chunked copy (no RAM explosion)
        chunk_size = 5000

        for i in range(0, TOTAL_SAMPLES, chunk_size):
            dset[i:i+chunk_size] = data[i:i+chunk_size]

            if i % (chunk_size * 200) == 0:
                print(f"Progress: {i}/{TOTAL_SAMPLES}")

        f.attrs["sampling_rate"] = SAMPLING_RATE

    print(f"✅ Saved: {h5_path}")


def compare_sizes(npy_path, h5_path):
    npy_size = os.path.getsize(npy_path) / (1024 * 1024)
    h5_size = os.path.getsize(h5_path) / (1024 * 1024)

    print("\n📊 File Size Comparison:")
    print(f"{os.path.basename(npy_path)} : {npy_size:.2f} MB")
    print(f"{os.path.basename(h5_path)}  : {h5_size:.2f} MB")
    print(f"Saved: {npy_size - h5_size:.2f} MB")


def main():
    base_dir = r"C:\Users\DHANYATHA\OneDrive\Documents\Holter Monitor Analytical System\Holter-Monitor-Analytical-System\data"

    # ORIGINAL FILES (UNCHANGED)
    npy_3 = os.path.join(base_dir, "ecg_48hr_3leads.npy")
    npy_12 = os.path.join(base_dir, "ecg_48hr_12leads.npy")

    # NEW FILES (CREATED)
    h5_3 = os.path.join(base_dir, "ecg_48hr_3leads_converted.h5")
    h5_12 = os.path.join(base_dir, "ecg_48hr_12leads_converted.h5")

    print("🚀 Starting conversion WITHOUT modifying original files...")

    # Convert
    convert_memmap_to_h5(npy_3, h5_3, num_leads=3)
    convert_memmap_to_h5(npy_12, h5_12, num_leads=12)

    # Compare sizes
    compare_sizes(npy_3, h5_3)
    compare_sizes(npy_12, h5_12)

    print("\n✅ DONE — Original .npy untouched, new .h5 created")


if __name__ == "__main__":
    main()