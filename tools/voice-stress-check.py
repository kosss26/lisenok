#!/usr/bin/env python3
"""Acoustic stress check for single-word clips: finds the vowel nuclei (intensity peaks in voiced
stretches, after de Jong & Wempe) and says which syllable is the most prominent (duration x loudness
of the nucleus). Flags clips where it is not the marked syllable, or where the nuclei count differs.
  python3 tools/voice-stress-check.py [keys | @file]   (default: all polysyllabic w-/n- clips)"""
import json, re, subprocess, sys
import numpy as np, parselmouth

LINES = json.load(open("assets/voice-lines.json", encoding="utf-8"))
LEX = json.load(open("assets/voice-stress.json", encoding="utf-8"))
V = "аеёиоуыэюя"


def target(text):
    """index of the stressed vowel in the word, number of vowels"""
    w = text.replace("+", "").lower()
    m = LEX.get(w, text.lower())
    if "ё" in w:
        m = w.replace("ё", "+ё", 1)
    if "+" not in m:
        return None, sum(c in V for c in w)
    before = m[: m.index("+")]
    return sum(c in V for c in before), sum(c in V for c in w)


def nuclei(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "24000", "-"],
                         capture_output=True).stdout
    snd = parselmouth.Sound(np.frombuffer(raw, np.float32).astype(np.float64), 24000)
    inten = snd.to_intensity(time_step=0.005, minimum_pitch=100)
    pitch = snd.to_pitch(time_step=0.005, pitch_floor=75, pitch_ceiling=600)
    t = inten.xs(); i = inten.values[0]
    voiced = np.array([pitch.get_value_at_time(x) == pitch.get_value_at_time(x) for x in t])
    floor = np.percentile(i, 99) - 25
    peaks = []
    for k in range(2, len(i) - 2):
        if voiced[k] and i[k] > floor and i[k] == i[max(0, k - 8):k + 9].max():
            peaks.append(k)
    # merge peaks without a dip of 2 dB between them
    merged = []
    for k in peaks:
        if merged and i[merged[-1]:k + 1].min() > min(i[merged[-1]], i[k]) - 2:
            if i[k] > i[merged[-1]]: merged[-1] = k
            continue
        merged.append(k)
    out = []
    for k in merged:  # nucleus: voiced stretch around the peak within 6 dB of it
        a = k
        while a > 0 and voiced[a - 1] and i[a - 1] > i[k] - 6: a -= 1
        b = k
        while b < len(i) - 1 and voiced[b + 1] and i[b + 1] > i[k] - 6: b += 1
        out.append(((b - a + 1) * 0.005, i[k], pitch.get_value_at_time(t[k]) or 0))
    return out


def main():
    args = sys.argv[1:]
    keys = []
    for a in args:
        keys += open(a[1:]).read().split() if a.startswith("@") else [a]
    if not keys:
        keys = [k for k, v in LINES.items() if re.match(r"^(w|n)-", k) and " " not in v
                and sum(c in V for c in v.lower()) > 1]
    bad = 0
    for k in keys:
        tgt, nv = target(LINES[k])
        nu = nuclei(f"public/voice/{k}.mp3")
        if tgt is None:
            continue
        if len(nu) != nv:
            print(f"COUNT {k} {LINES[k]}: {len(nu)} nuclei, {nv} vowels  {[(round(d, 3), round(db)) for d, db, _ in nu]}")
            bad += 1
            continue
        score = [d * 10 ** (db / 20) for d, db, _ in nu]
        best = int(np.argmax(score))
        if best != tgt:
            ratio = score[best] / score[tgt]
            print(f"STRESS? {k} {LINES[k]}: loudest/longest syllable {best + 1}, marked {tgt + 1}, x{ratio:.2f}  "
                  f"{[(round(d, 3), round(db), round(f0)) for d, db, f0 in nu]}")
            bad += 1
    print(f"checked {len(keys)}, flagged {bad}")


main()
