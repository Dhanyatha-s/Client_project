# import neurokit2 as nk
# import matplotlib.pyplot as plt
# import numpy as np
# import os


# DATA_DIR = "data"
# os.makedirs(DATA_DIR, exist_ok=True)

# SAMPLING_RATE = 250
# CHUNK_DURATION = 10  # seconds
# TOTAL_DURATION = 172800  # 48 hr

# NUM_CHUNKS = TOTAL_DURATION // CHUNK_DURATION


# """
# This code simulates a synthetic ECG signal using the `neurokit2` library. The `ecg_simulate` 
# function is used to generate an ECG signal with a specified duration, sampling rate, and heart rate. 
# The resulting ECG signal is then plotted using `matplotlib`.
# """
# # ecg = nk.ecg_simulate(duration=10, sampling_rate=250, heart_rate=72)
# # plt.title('Synthetic ECG 10 seconds')
# # plt.plot(ecg)
# # plt.show()

# # # Simulating different conditions
# # ecg_arrhythmia = nk.ecg_simulate(duration=10, sampling_rate=250, heart_rate=72, arrhythmia=True)
# # plt.title('Synthetic ECG with Arrhythmia')
# # plt.plot(ecg_arrhythmia)
# # plt.show()

# # ecg_noise = nk.ecg_simulate(duration=10, sampling_rate=250, heart_rate=72, noise=0.5)
# # plt.title('Synthetic ECG with Noise')   
# # plt.plot(ecg_noise)
# # plt.show()

# # ecg_brady = nk.ecg_simulate(duration=10, sampling_rate=250, heart_rate=40) # for bradycardia
# # plt.title('Synthetic ECG for Bradycardia')
# # plt.plot(ecg_brady)
# # plt.show()

# # ecg_tachy = nk.ecg_simulate(duration=10, sampling_rate=250, heart_rate=150) # for tachycardia
# # plt.title('Synthetic ECG for Tachycardia')
# # plt.plot(ecg_tachy)
# # plt.show()

# # # PRINTING SHAPES OF ALL SIMULATED ECG SIGNALS
# # print("Shape of Normal ECG:", ecg.shape)
# # print("Shape of Arrhythmia ECG:", ecg_arrhythmia.shape)
# # print("Shape of Noisy ECG:", ecg_noise.shape)
# # print("Shape of Bradycardia ECG:", ecg_brady.shape)
# # print("Shape of Tachycardia ECG:", ecg_tachy.shape)

# # # PRINTING FIRST 10 VALUES OF ALL SIMULATED ECG SIGNALS
# # print("First 10 values of Normal ECG:", ecg[:10])
# # print("First 10 values of Arrhythmia ECG:", ecg_arrhythmia[:10])
# # print("First 10 values of Noisy ECG:", ecg_noise[:10])
# # print("First 10 values of Bradycardia ECG:", ecg_brady[:10])
# # print("First 10 values of Tachycardia ECG:", ecg_tachy[:10])

# """
# All the simulated ECG signals have the same shape since they are generated with the same duration and sampling rate. 
# The differences lie in the characteristics of the signals, such as the presence of arrhythmia, noise, or variations in heart rate. 
# The first 10 values of each signal provide a glimpse into the initial part of the ECG waveform, which can be useful for analysis and comparison.

# """
# # Now lets scale it upto 48hr
# # def generate_4bhr_single_lead_ecg():
# #     # Simulate a 48-hour ECG signal with a sampling rate of 250 Hz and a heart rate of 72 bpm
# #     ecg_48hr = nk.ecg_simulate(duration=172800, sampling_rate=250, heart_rate=72, noise=0.08)
# #     # plt.title('Synthetic ECG 48 hours')
# #     # plt.plot(ecg_48hr)
# #     # SAVE THE SIGNAM INTO DATA FOLDER
# #     np.save(os.path.join(DATA_DIR, 'ecg_48hr.npy'), ecg_48hr)
# #     return ecg_48hr

# def generate_48hr_3lead_ecg():
#     # Simulate a 48-hour ECG signal with 3 leads, a sampling rate of 250 Hz, and a heart rate of 72 bpm
#     base = nk.ecg_simulate(duration=172800, sampling_rate=250, heart_rate=72, noise=0.08)

#     lead_1 = base
#     lead_2 = base + np.random.normal(0, 0.02, size=base.shape)  # Adding slight noise for lead 2
#     lead_3 = base + np.random.normal(0, 0.02, size=base.shape)  # Adding slight noise for lead 3
#     ecg_48hr_3leads = np.column_stack([lead_1, lead_2, lead_3])
#     # ecg_48hr_3leads = nk.ecg_simulate(duration=172800, sampling_rate=250, heart_rate=72, noise=0.08, n_leads=3)
#     # plt.title('Synthetic ECG 48 hours with 3 leads')
#     # plt.plot(ecg_48hr_3leads)
#     # SAVE THE SIGNAM INTO DATA FOLDER
#     np.save(os.path.join(DATA_DIR, 'ecg_48hr_3leads.npy'), ecg_48hr_3leads)
#     return ecg_48hr_3leads

# def generate_48hr_ecg_with_12_leads():

#     df = nk.ecg_simulate(duration=172800, sampling_rate=250, heart_rate=72, noise=0.08, n_leads=12)
#     # plt.title('Synthetic ECG 48 hours with 12 leads')
#     # plt.plot(df)
#     # SAVE THE SIGNAM INTO DATA FOLDER
#     np.save(os.path.join(DATA_DIR, 'ecg_48hr_12leads.npy'), df)
#     return df   

# if __name__ == "__main__":
#     print("Generating ECG signals...")

#     # s = generate_4bhr_single_lead_ecg()
#     # print("Single lead shape:", s.shape)

#     t = generate_48hr_3lead_ecg()
#     print("3-lead shape:", t.shape)

#     tw = generate_48hr_ecg_with_12_leads()
#     print("12-lead shape:", tw.shape)

#     print("Saved all .npy files in /data")





import os
import numpy as np
import neurokit2 as nk

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

SAMPLING_RATE = 250
CHUNK_DURATION = 10  # seconds
TOTAL_DURATION = 172800  # 48 hours

SAMPLES_PER_CHUNK = SAMPLING_RATE * CHUNK_DURATION
TOTAL_SAMPLES = SAMPLING_RATE * TOTAL_DURATION
NUM_CHUNKS = TOTAL_DURATION // CHUNK_DURATION

# # def generate_4bhr_single_lead_ecg():
# #     # Simulate a 48-hour ECG signal with a sampling rate of 250 Hz and a heart rate of 72 bpm
# #     ecg_48hr = nk.ecg_simulate(duration=172800, sampling_rate=250, heart_rate=72, noise=0.08)
# #     # plt.title('Synthetic ECG 48 hours')
# #     # plt.plot(ecg_48hr)
# #     # SAVE THE SIGNAM INTO DATA FOLDER
# #     np.save(os.path.join(DATA_DIR, 'ecg_48hr.npy'), ecg_48hr)
# #     return ecg_48hr

# =========================================================
# 3-LEAD ECG (48hr) → SAFE MEMORY-MAPPED NPY
# =========================================================
def generate_48hr_3lead_ecg():
    file_path = os.path.join(DATA_DIR, "ecg_48hr_3leads.npy")

    print("Creating memory-mapped file for 3-lead ECG...")

    # Create memmap file (disk-backed, no RAM explosion)
    ecg_memmap = np.memmap(
        file_path,
        dtype="float32",              # reduce size (important)
        mode="w+",
        shape=(TOTAL_SAMPLES, 3)
    )

    write_index = 0

    for i in range(NUM_CHUNKS):

        base = nk.ecg_simulate(
            duration=CHUNK_DURATION,
            sampling_rate=SAMPLING_RATE,
            heart_rate=72,
            noise=0.08
        )

        l1 = base
        l2 = base + np.random.normal(0, 0.02, size=base.shape)
        l3 = base + np.random.normal(0, 0.02, size=base.shape)

        chunk = np.column_stack([l1, l2, l3]).astype("float32")

        ecg_memmap[write_index:write_index + SAMPLES_PER_CHUNK] = chunk
        write_index += SAMPLES_PER_CHUNK

        if i % 500 == 0:
            print(f"[3-Lead] Processed {i}/{NUM_CHUNKS} chunks")

    ecg_memmap.flush()

    print("Saved 48hr 3-lead ECG →", file_path)
    return file_path


# =========================================================
# 12-LEAD ECG (48hr) → SAFE MEMORY-MAPPED NPY
# =========================================================
def generate_48hr_12lead_ecg():
    file_path = os.path.join(DATA_DIR, "ecg_48hr_12leads.npy")

    print("Creating memory-mapped file for 12-lead ECG...")

    ecg_memmap = np.memmap(
        file_path,
        dtype="float32",
        mode="w+",
        shape=(TOTAL_SAMPLES, 12)
    )

    write_index = 0

    for i in range(NUM_CHUNKS):

        df = nk.ecg_simulate(
            duration=CHUNK_DURATION,
            sampling_rate=SAMPLING_RATE,
            method="multileads",
            noise=0.08
        )

        chunk = df.values.astype("float32")

        ecg_memmap[write_index:write_index + SAMPLES_PER_CHUNK] = chunk
        write_index += SAMPLES_PER_CHUNK

        if i % 500 == 0:
            print(f"[12-Lead] Processed {i}/{NUM_CHUNKS} chunks")

    ecg_memmap.flush()

    print("Saved 48hr 12-lead ECG →", file_path)
    return file_path


# =========================================================
#  MAIN
# =========================================================
if __name__ == "__main__":
    print("Generating 48hr ECG data safely...")

    path_3 = generate_48hr_3lead_ecg()
    path_12 = generate_48hr_12lead_ecg()

    print("\n DONE")
    print("3-lead file:", path_3)
    print("12-lead file:", path_12)