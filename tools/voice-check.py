# Checks voice clips with speech recognition (faster-whisper).
# Usage: python3 tools/voice-check.py [--carrier] [--model medium] key ...   (or @file with keys)
#   --carrier  plays "Найди слово" first: single words are recognised far better in a phrase.
# float32 by default: int8 produced random garbage on some CPUs (ASR_TYPE=int8 to override).
# Prints a similarity score per clip (Russian vowel reduction о→а, е/я→и is tolerated).
# pip install faster-whisper numpy   (ffmpeg on PATH)
import os, sys, json, re, subprocess, difflib
import numpy as np
from faster_whisper import WhisperModel

args = sys.argv[1:]
carrier = "--carrier" in args
model = "medium"
if "--model" in args:
    model = args[args.index("--model") + 1]
    args.remove("--model"); args.remove(model)
keys = []
for a in args:
    if a.startswith("--"):
        continue
    keys += open(a[1:]).read().split() if a.startswith("@") else [a]
m = WhisperModel(model, device="cpu", compute_type=os.environ.get("ASR_TYPE", "float32"), cpu_threads=int(os.environ.get("ASR_THREADS", "4")))
L = json.load(open("assets/voice-lines.json", encoding="utf-8"))

def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

red = lambda s: re.sub(r"[^а-я]", "", s.lower().replace("ё", "е").replace("ю", "йу").replace("+", "")) \
    .replace("о", "а").replace("е", "и").replace("я", "и")
pre = pcm("public/voice/q-word-find.mp3") if carrier else np.zeros(0, np.float32)
low = []
for k in keys:
    audio = np.concatenate([pre, np.zeros(2400, np.float32), pcm(f"public/voice/{k}.mp3"), np.zeros(8000, np.float32)])
    segs, _ = m.transcribe(audio, language="ru", beam_size=5, condition_on_previous_text=False)
    hyp = " ".join(s.text for s in segs).strip()
    said = re.sub(r"(?i)^.*?сл[оа]в[оа][,.!]?\s*", "", hyp) if carrier else hyp
    r = difflib.SequenceMatcher(None, red(L[k]), red(said)).ratio()
    print(f"{r:.2f} {k} | {L[k]} | {hyp}", flush=True)
    if r < 0.75:
        low.append(k)
print("LOW:", " ".join(low))
