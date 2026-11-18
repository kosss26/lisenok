#!/usr/bin/env python3
"""Re-takes for clips that speech recognition did not hear right: tries other speeds (and text variants
from the command line), recognises each take (faster-whisper; single words after «Найди слово»)
and keeps the best one (the current take wins ties).
  python3 tools/voice-retake.py key [key ...] [--variants='{"w-som": ["С+ом.", "сом!"]}']"""
import difflib, importlib.util, json, os, re, subprocess, sys, time
import numpy as np
from faster_whisper import WhisperModel

spec = importlib.util.spec_from_file_location("mv", os.path.join(os.path.dirname(__file__), "make-voice.py"))
mv = importlib.util.module_from_spec(spec); sys.argv, argv = sys.argv[:1], sys.argv; spec.loader.exec_module(mv); sys.argv = argv
import yandex_tts

args = [a for a in sys.argv[1:] if not a.startswith("--")]
opts = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
variants = json.loads(opts.get("variants", "{}"))
model = WhisperModel("medium", device="cpu", compute_type="float32", cpu_threads=6)
red = lambda s: re.sub(r"[^а-я]", "", s.lower().replace("ё", "е").replace("ю", "йу").replace("+", "")) \
    .replace("о", "а").replace("е", "и").replace("я", "и")


def pcm16(x48):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", "-", "-f", "s16le",
                          "-ar", "16000", "-"], input=x48.astype(np.float32).tobytes(), capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def mp3_16(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


carrier = mp3_16("public/voice/q-word-find.mp3")


def heard(key, audio):
    single = bool(mv.SINGLE.match(key))
    a = np.concatenate([carrier if single else np.zeros(0, np.float32), np.zeros(2400, np.float32), audio,
                        np.zeros(8000, np.float32)])
    segs, _ = model.transcribe(a, language="ru", beam_size=5, condition_on_previous_text=False)
    hyp = " ".join(s.text for s in segs).strip()
    said = re.sub(r"(?i)^.*?сл[оа]в[оа][,.!]?\s*", "", hyp) if single else hyp
    return difflib.SequenceMatcher(None, red(mv.LINES[key]), red(said)).ratio(), hyp


spent = 0.0
for key in args:
    c = mv.cast(key)
    base = mv.speed_for(key, c["voice"])  # (a speed kept by an earlier retake counts as the base)
    cur = heard(key, mp3_16(f"public/voice/{key}.mp3"))
    best = (cur[0], cur[1], None)
    print(f"{key}: current {cur[0]:.2f} «{cur[1]}»", flush=True)
    unknown = set()
    texts = [mv.marked(key, unknown)] + variants.get(key, [])
    for text in texts:
        for sp in sorted({base, round(base - 0.1, 2), round(base + 0.1, 2)}):
            raw = yandex_tts.synth(text, c["voice"], c["role"], sp, c["pitch"])
            spent += yandex_tts.units(text) * yandex_tts.PRICE_PER_UNIT
            y = mv.clean(raw)
            r, hyp = heard(key, pcm16(y))
            print(f"   {r:.2f} speed {sp} {text!r}: «{hyp}»", flush=True)
            with open(mv.LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps({"key": key, "text": text, **c, "speed": sp, "rub": yandex_tts.PRICE_PER_UNIT,
                                    "retake": True, "asr": r, "t": time.strftime("%Y-%m-%d %H:%M:%S")},
                                   ensure_ascii=False) + "\n")
            if r > best[0] + 1e-9:
                best = (r, hyp, (raw, y, text, sp))
    if best[2]:
        raw, y, text, sp = best[2]
        open(f"{mv.MASTER}/{key}.raw", "wb").write(raw)
        mv.encode(key, y)
        o = json.load(open("assets/voice-yandex.json", encoding="utf-8"))
        old = o.get(key)
        entry = {"speed": sp}
        if text != texts[0]:
            entry["text"] = text
        elif old:  # keep an earlier text override
            entry["text"] = old.get("text") if isinstance(old, dict) else old
            entry = {k: v for k, v in entry.items() if v}
        if sp == base and "text" not in entry:
            o.pop(key, None)
        elif sp == base and isinstance(old, str) and entry.get("text") == old:
            pass
        else:
            o[key] = entry
        json.dump(o, open("assets/voice-yandex.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"  -> kept speed {sp} {text!r} ({best[0]:.2f})", flush=True)
    else:
        print("  -> kept the current take", flush=True)
print(f"retakes: {spent:.2f} ₽")
