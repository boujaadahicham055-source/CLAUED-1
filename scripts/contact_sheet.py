"""Tiles PNG stills (named fNNN.png) into a labelled contact sheet.
usage: python3 scripts/contact_sheet.py <stills_dir> <out.png> [cols] [thumb_width]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

src, out = Path(sys.argv[1]), sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
th = tw * 16 // 9
files = sorted(src.glob('f*.png'))
rows = (len(files) + cols - 1) // cols
pad, label_h = 8, 30
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + label_h + pad) + pad), (18, 18, 20))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(files):
    frame = int(f.stem[1:])
    x = pad + (i % cols) * (tw + pad)
    y = pad + (i // cols) * (th + label_h + pad)
    sheet.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + label_h))
    d.text((x + 4, y + 5), f'f{frame}  {frame / 30:.2f}s', fill=(255, 200, 80), font=font)
sheet.save(out)
print(out, sheet.size)
