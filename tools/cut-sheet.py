# Cuts the generated art sheets (characters / objects on a white background) into one
# transparent WebP per item: rembg finds the alpha, connected parts are grouped, sorted in
# reading order, trimmed and scaled.
# Usage: python3 tools/cut-sheet.py [sheet-name ...]   (pip install "rembg[cpu]" scipy pillow)
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import new_session, remove

SRC, OUT = "assets/sheets", "public/art"
# sheet -> (rows, names in reading order, max side in px)
SHEETS = {
    "fox-ref.jpg": (1, ["fox-wave", "fox-walk", "fox-jump"], 520),
    "fox-poses.jpg": (2, ["fox-think", "fox-cheer", "fox-read", "fox-point"], 520),
    "fox-poses-2.jpg": (1, ["fox-listen", "fox-nod", "fox-clap"], 520),
    "residents-1.jpg": (2, ["hedgehog", "squirrel", "hare", "owl"], 460),
    "residents-2.jpg": (2, ["bear", "beaver", "badger", "mouse"], 460),
    "misc.jpg": (2, ["frog", "star-face", "star", "chest"], 400),
    "objects-1.jpg": (3, ["apple", "mushroom", "cone", "acorn", "raspberry", "leaf", "beetle", "honey", "fish"], 260),
    "objects-2.jpg": (3, ["house", "cheese", "poppy", "onion", "oak", "moon", "carrot", "strawberry", "daisy"], 260),
    "treasures.jpg": (3, ["t-acorn", "t-feather", "t-firefly", "t-snail", "t-maple", "t-pebble", "t-whistle", "t-rowan", "t-clover"], 300),
}
# resident poses for the dialogues: worried (asking for help) and happy
for r in ["hedgehog", "squirrel", "hare", "owl", "bear", "beaver", "badger", "mouse", "frog"]:
    SHEETS[f"res-{r}.jpg"] = (1, [f"{r}-sad", f"{r}-happy"], 460)
# picture words (stage 3): 3x3 sheets, names in reading order; "_" = an item replaced by w25.jpg
WORD_SHEETS = json.load(open("assets/word-sheets.json"))
for sheet, names in WORD_SHEETS.items():
    SHEETS[sheet] = (3 if len(names) == 9 else 2, names, 260)
session = new_session("isnet-general-use")
only = set(sys.argv[1:])
os.makedirs(OUT, exist_ok=True)
for sheet, (rows, names, side) in SHEETS.items():
    if only and sheet not in only:
        continue
    img = Image.open(f"{SRC}/{sheet}").convert("RGB")
    cut = np.array(remove(img, session=session))
    alpha = cut[:, :, 3]
    solid = alpha > 60
    grouped = ndi.binary_dilation(solid, iterations=3 if sheet in WORD_SHEETS else 14)
    labels, count = ndi.label(grouped)
    sizes = ndi.sum(solid, labels, range(1, count + 1))
    if sheet in WORD_SHEETS:
        # strict grid: every part whose centre falls in a cell belongs to that cell's item
        # (keeps detached bits such as raindrops or a balloon string with their item)
        cols = len(names) // rows
        centres = ndi.center_of_mass(solid, labels, range(1, count + 1))
        cells = {}
        for lab, (cy, cx), size in zip(range(1, count + 1), centres, sizes):
            if size < 40:
                continue
            idx = int(cy // (img.height / rows)) * cols + int(cx // (img.width / cols))
            cells.setdefault(idx, []).append(lab)
        groups = [cells.get(i, []) for i in range(len(names))]
    else:
        keep = np.argsort(sizes)[::-1][: len(names)] + 1
        centres = ndi.center_of_mass(solid, labels, keep)
        cell = img.height / rows
        order = sorted(zip(keep, centres), key=lambda kc: (int(kc[1][0] // cell), kc[1][1]))
        groups = [[lab] for lab, _ in order]
    for labs, name in zip(groups, names):
        if name == "_":
            continue
        if not labs:
            print("EMPTY CELL", sheet, name)
            continue
        mask = np.isin(labels, labs)
        a = np.where(mask, alpha, 0).astype(np.uint8)
        ys, xs = np.nonzero(a > 8)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = cut.copy()
        rgba[:, :, 3] = a
        piece = Image.fromarray(rgba[y0:y1, x0:x1])
        piece.thumbnail((side, side), Image.LANCZOS)
        pad = max(4, side // 40)
        canvas = Image.new("RGBA", (piece.width + pad * 2, piece.height + pad * 2))
        canvas.paste(piece, (pad, pad))
        canvas.save(f"{OUT}/{name}.webp", quality=88, method=6)
        print(sheet, name, canvas.size)
