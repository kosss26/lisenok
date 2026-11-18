# Synthesizes every spoken line with Silero TTS v5 (ru), voice "xenia", into public/voice/<key>.mp3.
# The list comes from src/content/voice.ts: run `npm run voice:list` first (writes assets/voice-lines.json).
# Silero models are licensed CC BY-NC 4.0 — fine for this personal, non-commercial game.
# Usage: python3 tools/make-voice.py <path to v5_ru.pt> [only-missing] [key ...]
#        (model: https://models.silero.ai/models/tts/ru/v5_ru.pt; pip install torch numpy)
import json, os, subprocess, sys, tempfile, wave
import numpy as np
import torch

SPEAKER = "xenia"
RATE = 48000
torch.set_num_threads(4)
model = torch.package.PackageImporter(sys.argv[1]).load_pickle("tts_models", "model")
args = sys.argv[2:]
only_missing = "only-missing" in args
pick = {a for a in args if a != "only-missing"}
lines = json.load(open("assets/voice-lines.json", encoding="utf-8"))
out = "public/voice"
os.makedirs(out, exist_ok=True)
done = 0
failed = []
with tempfile.TemporaryDirectory() as tmp:
    for key, text in lines.items():
        target = f"{out}/{key}.mp3"
        if pick and key not in pick:
            continue
        if only_missing and not pick and os.path.exists(target):
            continue
        # a lone letter or syllable reads better with a full stop
        try:
            audio = model.apply_tts(text=text if text[-1] in ".!?:" else text + ".", speaker=SPEAKER,
                                    sample_rate=RATE, put_accent=True, put_yo=True)
        except ValueError:
            print("cannot synthesize", key, repr(text))
            failed.append(key)
            continue
        pcm = (audio.numpy() * 32767).clip(-32768, 32767).astype(np.int16)
        wav = f"{tmp}/{key}.wav"
        with wave.open(wav, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav,
                        "-af", "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.1,areverse,loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.06",
                        "-ar", "24000", "-ac", "1", "-b:a", "40k", "-map_metadata", "-1", target], check=True)
        done += 1
# drop clips for lines that no longer exist
stale = [f for f in os.listdir(out) if f.endswith(".mp3") and f[:-4] not in lines]
for f in stale:
    os.remove(f"{out}/{f}")
if failed:
    print("FAILED:", failed)
print(done, "made,", len(stale), "removed,", len(lines), "lines")
