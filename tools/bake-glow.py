# Bakes a soft golden glow into the star picture (star -> star-glow), so the many twinkling
# stars on the forest path and in the sky need no CSS drop-shadow filter (cheap to animate).
# The canvas grows by PAD on every side: CSS sizes for star-glow are 1 + 2*PAD times bigger.
# Usage: python3 tools/bake-glow.py
from PIL import Image, ImageFilter

PAD = 0.18
src = Image.open("public/art/star.webp").convert("RGBA")
w, h = src.size
px, py = round(w * PAD), round(h * PAD)
canvas = (w + 2 * px, h + 2 * py)
alpha = Image.new("L", canvas, 0)
alpha.paste(src.getchannel("A"), (px, py))
glow = Image.new("RGBA", canvas, (255, 214, 90, 0))
# a wide faint halo and a tighter bright rim
wide = alpha.filter(ImageFilter.GaussianBlur(w * 0.07)).point(lambda a: min(255, int(a * 1.05)))
rim = alpha.filter(ImageFilter.GaussianBlur(w * 0.025)).point(lambda a: min(255, int(a * 1.2)))
halo = Image.composite(Image.new("RGBA", canvas, (255, 250, 225, 255)), Image.new("RGBA", canvas, (255, 210, 80, 255)), rim)
halo.putalpha(Image.eval(Image.merge("L", [wide]), lambda a: a).point(lambda a: a))
out = Image.new("RGBA", canvas, (0, 0, 0, 0))
out.alpha_composite(halo)
rim_layer = Image.new("RGBA", canvas, (255, 248, 220, 0))
rim_layer.putalpha(rim.point(lambda a: int(a * 0.8)))
out.alpha_composite(rim_layer)
out.alpha_composite(src, (px, py))
out.save("public/art/star-glow.webp", quality=88, method=6)
print("star-glow", out.size)
