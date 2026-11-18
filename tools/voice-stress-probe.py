#!/usr/bin/env python3
"""Which stress marks actually change the synthesizer's reading? For every word of assets/voice-stress.json:
synthesize it alone with our mark and without any mark (marina, friendly). The engine is deterministic,
so identical audio = the engine stresses the word the same way by itself; different audio = our mark
overrides its own choice -> those words are listed for a second manual check (tmp/stress-probe.json)."""
import hashlib, json, os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
import yandex_tts

LEX = json.load(open("assets/voice-stress.json", encoding="utf-8"))
OUT = "tmp/stress-probe.json"
done = json.load(open(OUT)) if os.path.exists(OUT) else {}


def probe(w):
    a = yandex_tts.synth(LEX[w], "marina", "friendly", 1.0)
    b = yandex_tts.synth(w, "marina", "friendly", 1.0)
    os.makedirs("tmp/stress-probe", exist_ok=True)
    if a != b:
        open(f"tmp/stress-probe/{w}.marked.raw", "wb").write(a)
        open(f"tmp/stress-probe/{w}.plain.raw", "wb").write(b)
    return w, {"same": a == b, "marked_s": len(a) / 96000, "plain_s": len(b) / 96000}


todo = [w for w in LEX if w not in done]
with ThreadPoolExecutor(2) as ex:
    for i, (w, r) in enumerate(ex.map(probe, todo)):
        done[w] = r
        if i % 50 == 0:
            json.dump(done, open(OUT, "w"), ensure_ascii=False, indent=0)
            print(i, len(todo), flush=True)
json.dump(done, open(OUT, "w"), ensure_ascii=False, indent=0)
diff = sorted(w for w, r in done.items() if not r["same"])
print(f"{len(done)} words, {len(diff)} where the mark changes the reading ({2 * len(todo) * yandex_tts.PRICE_PER_UNIT:.1f} ₽)")
print(" ".join(LEX[w] for w in diff))
