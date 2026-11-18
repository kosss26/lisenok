# Background music and the forest ambience, from the freely licensed sources listed in
# assets/SOUND-CREDITS.md (downloaded into assets/music-src, not in the repository).
# Usage: python3 tools/make-music.py      (ffmpeg, numpy)
#   public/music/map.mp3        Kevin MacLeod "Carefree" (CC BY 4.0)         — world map, forest path
#   public/music/tasks.mp3      Kevin MacLeod "Easy Lemon" (CC BY 4.0)       — tasks (calm)
#   public/music/celebrate.mp3  Kevin MacLeod "Fluffing a Duck" (CC BY 4.0)  — rewards, celebration
#   public/music/forest.mp3     ambience loop: stream + birds + wind (CC0 recordings)
import os, subprocess
import numpy as np

SRC, OUT, SR = "assets/music-src", "public/music", 24000
os.makedirs(OUT, exist_ok=True)

def track(src, name, start, length):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length), "-i", f"{SRC}/{src}",
                    "-af", f"afade=t=in:d=1.5,afade=t=out:st={length - 4}:d=4,loudnorm=I=-20:TP=-2",
                    "-ac", "1", "-ar", "44100", "-b:a", "64k", "-map_metadata", "-1", f"{OUT}/{name}.mp3"], check=True)

def load(src, start=0, length=None, extra=""):
    args = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(length)] if length else []) + \
           ["-i", f"{SRC}/{src}"] + (["-af", extra] if extra else []) + ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(args, capture_output=True, check=True).stdout, np.float32).copy()

def calmest(src, length, extra=""):
    """start (s) of the steadiest `length`-second stretch: no door slams, voices or gusts"""
    a = load(src, extra=extra)
    c = np.concatenate([[0], np.cumsum(a.astype(np.float64) ** 2)])
    rms = np.sqrt((c[SR::SR // 2] - c[: len(c) - SR : SR // 2][: len(c[SR::SR // 2])]) / SR)
    win = length * 2
    best = min(range(0, len(rms) - win), key=lambda i: rms[i:i + win].std() / (rms[i:i + win].mean() + 1e-9))
    return best / 2

def loop(a, seconds, fade=4.0):
    """seamless loop: the tail fades into the head"""
    n, f = int(seconds * SR), int(fade * SR)
    a = a[: n + f].copy()
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    a[:f] = a[:f] * ramp + a[n:n + f] * (1 - ramp)
    return a[:n]

def norm(a, peak=1.0):
    return a / (np.abs(a).max() + 1e-9) * peak

track("carefree.mp3", "map", 0, 100)
track("easy-lemon.mp3", "tasks", 0, 120)
track("fluffing-a-duck.mp3", "celebrate", 0, 45)

L = 40
river = load("park_ambience_river.wav", calmest("park_ambience_river.wav", L + 5), L + 5, "highpass=f=120")
wind = load("park_ambience_wind.wav", calmest("park_ambience_wind.wav", L + 5, "lowpass=f=700"), L + 5, "lowpass=f=700")
birds = load("birds-isaiah658.ogg", extra="highpass=f=900")
birds = np.concatenate([birds, birds])[: len(river)]  # 30 s recording, twice
mix = loop(norm(river, 0.55) + norm(wind, 0.35) + norm(birds, 0.6), L)
wav = "/tmp/forest-ambience.wav"
import wave
with wave.open(wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((norm(mix, 0.9) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-24:TP=-3", "-ac", "1", "-ar", "24000",
                "-b:a", "48k", "-map_metadata", "-1", f"{OUT}/forest.mp3"], check=True)
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(f"{OUT}/{f}") // 1024, "KB")
