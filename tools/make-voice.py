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
# residents speak with their own Silero speaker and a pitch shift (key -> {speaker, pitch})
voices = json.load(open("assets/voice-speakers.json", encoding="utf-8"))
out = "public/voice"

# A lone vowel comes out of Silero as a ~60 ms blip, or glides into another vowel (ы -> и).
# So: synthesize a few slow variants, measure formants (Praat), keep the longest steady stretch
# that really is the wanted vowel, and stretch it a little. pip install praat-parselmouth
VOWELS = {"letter-a": "а", "letter-o": "о", "letter-u": "у", "letter-y": "ы", "letter-eh": "э", "letter-i": "и"}
TARGET = {"а": ((650, 1100), (1100, 1750)), "о": ((380, 650), (700, 1250)), "у": ((200, 430), (500, 1150)),
          "ы": ((230, 470), (1450, 2100)), "э": ((420, 720), (1700, 2300)), "и": ((180, 400), (2200, 3000))}

def steady_run(audio, v):
    import math, parselmouth
    s = parselmouth.Sound(audio.astype(np.float64), RATE)
    p, f = s.to_pitch(0.01, 120, 500), s.to_formant_burg(0.01, 5, 5500)
    (a1, b1), (a2, b2) = TARGET[v]
    xs, best, start = p.xs(), (0, 0), None
    ok = [not math.isnan(p.get_value_at_time(t)) and a1 <= f.get_value_at_time(1, t) <= b1
          and a2 <= f.get_value_at_time(2, t) <= b2 for t in xs]
    for i, good in enumerate(ok + [False]):
        if good and start is None:
            start = i
        elif not good and start is not None:
            if i - start > best[1] - best[0]:
                best = (start, i)
            start = None
    if best[1] - best[0] < 3:
        return None
    return xs[best[0]], xs[best[1] - 1]

def voiced_seconds(audio):
    import math, parselmouth
    p = parselmouth.Sound(audio.astype(np.float64), RATE).to_pitch(0.01, 120, 500)
    return sum(0.01 for t in p.xs() if not math.isnan(p.get_value_at_time(t)))

def clear_vowel(v, speaker, key):
    variants = [f'<speak><prosody rate="slow">{v}-{v}</prosody></speak>',
                f'<speak><prosody rate="x-slow">{v}-{v}</prosody></speak>',
                f'<speak><prosody rate="slow">{v}</prosody></speak>', f"{v}-{v}."]
    best = None
    for ssml in variants:
        kw = {"ssml_text": ssml} if ssml.startswith("<speak>") else {"text": ssml}
        a = model.apply_tts(speaker=speaker, sample_rate=RATE, put_accent=True, put_yo=True, **kw).numpy()
        run = steady_run(a, v)
        if run and (best is None or run[1] - run[0] > best[1][1] - best[1][0]):
            best = (a, run)
    if best is None:
        raise ValueError(f"no clear {v}")
    a, (t0, t1) = best
    print(f"{key}: steady {v} for {t1 - t0 + 0.01:.2f}s")
    cut = a[int(max(0, t0 - 0.03) * RATE): int((t1 + 0.02) * RATE)].copy()
    rise = int(0.015 * RATE)
    cut[:rise] *= np.linspace(0, 1, rise)
    fade = int(0.05 * RATE)
    cut[-fade:] *= np.linspace(1, 0, fade)
    # stretch the steady vowel to about 0.4 s (pitch kept): WSOLA via ffmpeg atempo later
    VOWEL_TEMPO[key] = max(0.6, min(1.0, len(cut) / RATE / 0.42))
    return torch.from_numpy(cut)

VOWEL_TEMPO = {}
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
        speaker = voices.get(key, {}).get("speaker", SPEAKER)
        try:
            if key in VOWELS:
                audio = clear_vowel(VOWELS[key], speaker, key)
            elif key.startswith(("letter-", "syl-")):
                # a lone letter or syllable: Silero tends to swallow the vowel, so try it plain and
                # slow and keep the take with the longer voiced part
                takes = [model.apply_tts(text=text + ".", speaker=speaker, sample_rate=RATE, put_accent=True, put_yo=True),
                         model.apply_tts(ssml_text=f'<speak><prosody rate="slow">{text}</prosody></speak>',
                                         speaker=speaker, sample_rate=RATE, put_accent=True, put_yo=True)]
                audio = max(takes, key=lambda a: voiced_seconds(a.numpy()))
            else:
                audio = model.apply_tts(text=text if text[-1] in ".!?:" else text + ".", speaker=speaker,
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
        pitch = voices.get(key, {}).get("pitch", 1)
        shift = f"asetrate={RATE}*{pitch},aresample={RATE},atempo={1 / pitch:.4f}," if pitch != 1 else ""
        if key in VOWEL_TEMPO:
            shift += f"atempo={VOWEL_TEMPO[key]:.3f},"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav,
                        "-af", shift + "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.1,areverse,loudnorm=I=-16:TP=-1.5,apad=pad_dur=0.06",
                        "-ar", "24000", "-ac", "1", "-b:a", "40k", "-map_metadata", "-1", target], check=True)
        done += 1
# drop clips for lines that no longer exist
stale = [f for f in os.listdir(out) if f.endswith(".mp3") and f[:-4] not in lines]
for f in stale:
    os.remove(f"{out}/{f}")
if failed:
    print("FAILED:", failed)
print(done, "made,", len(stale), "removed,", len(lines), "lines")
