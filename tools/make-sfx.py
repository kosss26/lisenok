# Synthesizes the game's short sound effects (original, no third-party samples) into public/sfx/*.mp3
# (background music and forest sounds: tools/make-music.py).
# Usage: python3 tools/make-sfx.py
import os, subprocess, tempfile, wave
import numpy as np

R = 44100
OUT = "public/sfx"
os.makedirs(OUT, exist_ok=True)


def t(d):
    return np.arange(int(R * d)) / R


def bell(f, d, decay=6.0, partials=((1, 1), (2.0, 0.35), (3.01, 0.15), (4.2, 0.06))):
    x = t(d)
    s = sum(a * np.sin(2 * np.pi * f * m * x) for m, a in partials)
    env = np.exp(-decay * x) * np.minimum(1, x / 0.004)
    return s * env


def place(track, sig, at):
    i = int(at * R)
    track[i : i + len(sig)] += sig[: len(track) - i]


def save(name, sig, gain=0.8):
    sig = sig / (np.abs(sig).max() + 1e-9) * gain
    pcm = (sig * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as tmp:
        wav = f"{tmp}/a.wav"
        with wave.open(wav, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(R)
            w.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ar", "44100", "-ac", "1",
                        "-b:a", "64k", "-map_metadata", "-1", f"{OUT}/{name}.mp3"], check=True)


N = lambda semis: 440 * 2 ** (semis / 12)  # noqa: E731
C5, E5, G5, C6, E6, G6 = N(3), N(7), N(10), N(15), N(19), N(22)

# tap: soft wooden knock
x = t(0.09)
save("tap", np.sin(2 * np.pi * 820 * x) * np.exp(-60 * x) + 0.4 * np.sin(2 * np.pi * 1640 * x) * np.exp(-90 * x), 0.5)

# pick: little pluck for letters / syllables
x = t(0.25)
save("pick", bell(N(12), 0.25, 14) + 0.5 * bell(N(19), 0.25, 18), 0.55)

# right: two rising chimes
s = np.zeros(int(R * 0.9))
place(s, bell(E5, 0.7, 5), 0)
place(s, bell(C6, 0.8, 4.5), 0.11)
save("right", s, 0.7)

# wrong: soft low "boop-boop", not scary
x = t(0.18)
b = np.sin(2 * np.pi * (300 - 80 * x / 0.18) * x) * np.exp(-12 * x) * np.minimum(1, x / 0.01)
s = np.zeros(int(R * 0.45))
place(s, b, 0)
place(s, b * 0.8, 0.2)
save("wrong", s, 0.45)

# star: sparkly arpeggio with shimmer
s = np.zeros(int(R * 1.6))
for i, f in enumerate([C6, E6, G6, N(27), N(31)]):
    place(s, bell(f, 1.2, 4, ((1, 1), (2.76, 0.2), (5.4, 0.08))), i * 0.07)
rng = np.random.default_rng(3)
for k in range(18):
    place(s, 0.25 * bell(N(26 + rng.integers(0, 12)), 0.3, 12), 0.35 + rng.random() * 1.0)
save("star", s, 0.7)

# fanfare: warm major chord bells (world complete / reward)
s = np.zeros(int(R * 2.6))
for i, f in enumerate([C5, E5, G5, C6]):
    place(s, bell(f, 1.6, 2.6), i * 0.12)
for f in [C5, E5, G5, C6, E6]:
    place(s, 0.7 * bell(f, 2.0, 1.8), 0.6)
save("fanfare", s, 0.75)

# whoosh-pop: step on the path / open a stop
x = t(0.3)
noise = rng.standard_normal(len(x))
env = np.sin(np.pi * x / 0.3) ** 2
filt = np.convolve(noise, np.ones(30) / 30, mode="same")
save("step", filt * env + 0.6 * bell(N(14), 0.3, 18), 0.45)

print("sfx done")
