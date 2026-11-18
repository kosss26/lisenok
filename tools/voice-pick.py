# Tries several takes of one clip and keeps the one speech recognition understands best.
# Usage: python3 tools/voice-pick.py <v5_ru.pt> <key> "<variant>" ["<variant>" ...] [--apply]
#   variant: plain text ("пчел+а."), SSML ("<speak><prosody rate=\"slow\">пчел+а</prosody></speak>"),
#   optionally prefixed with a speaker: "baya|пчел+а."
# Each take is scored 3 times (three recognisers settings); with --apply the best one is written to
# assets/voice-overrides.json and rendered with tools/make-voice.py.
import sys, json, re, subprocess, difflib
import numpy as np, torch
from faster_whisper import WhisperModel

args = [a for a in sys.argv[1:] if a != "--apply"]
apply = "--apply" in sys.argv
model_path, key, variants = args[0], args[1], args[2:]
lines = json.load(open("assets/voice-lines.json", encoding="utf-8"))
RATE = 48000
tts = torch.package.PackageImporter(model_path).load_pickle("tts_models", "model")
# int8 gave nondeterministic garbage on this CPU; float32 is stable
asr = WhisperModel("medium", device="cpu", compute_type="float32")
red = lambda s: re.sub(r"[^а-я]", "", s.lower().replace("ё", "е").replace("ю", "йу").replace("+", "")) \
    .replace("о", "а").replace("е", "и").replace("я", "и")

def pcm16k(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

carrier = key.startswith("w-")
pre = pcm16k("public/voice/q-word-find.mp3")
want = red(lines[key])
results = []
for i, v in enumerate(variants):
    speaker, body = (v.split("|", 1) if "|" in v else ("xenia", v))
    kw = {"ssml_text": body} if body.startswith("<speak>") else {"text": body}
    a = tts.apply_tts(speaker=speaker, sample_rate=RATE, put_accent=True, put_yo=True, **kw).numpy()
    wav = f"/tmp/pick-{i}.wav"
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((a * 32767).clip(-32768, 32767).astype(np.int16).tobytes())
    clip = pcm16k(wav)
    scores, heard = [], []
    for ctx in ([pre, np.zeros(2400, np.float32)] if carrier else []), [np.zeros(4000, np.float32)]:
        for beam in (5, 1):
            audio = np.concatenate([*ctx, clip, np.zeros(8000, np.float32)])
            segs, _ = asr.transcribe(audio, language="ru", beam_size=beam, condition_on_previous_text=False)
            hyp = " ".join(s.text for s in segs).strip()
            said = re.sub(r"(?i)^.*?сл[оа]в[оа][,.!]?\s*", "", hyp)
            scores.append(difflib.SequenceMatcher(None, want, red(said)).ratio())
            heard.append(said)
    results.append((np.mean(scores), speaker, body, heard))
    print(f"{np.mean(scores):.2f} {speaker}|{body} -> {heard}", flush=True)
best = max(results, key=lambda r: r[0])
print("BEST", f"{best[0]:.2f}", best[1], best[2])
if apply:
    o = json.load(open("assets/voice-overrides.json", encoding="utf-8"))
    o[key] = {("ssml" if best[2].startswith("<speak>") else "text"): best[2]}
    if best[1] != "xenia":
        o[key]["speaker"] = best[1]
    json.dump(o, open("assets/voice-overrides.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    subprocess.run(["python3", "tools/make-voice.py", model_path, key], check=True)
