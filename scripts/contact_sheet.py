"""Tiles PNG stills (named fNNN.png) into a labelled contact sheet.
Labels each frame with its scene when deliverables/audio_timeline.json exists.
usage: python3 scripts/contact_sheet.py <stills_dir> <out.png> [cols] [thumb_width] [title]
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

src, out = Path(sys.argv[1]), sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
title = sys.argv[5] if len(sys.argv) > 5 else None
th = tw * 16 // 9
timeline = Path('deliverables/audio_timeline.json')
scenes = json.loads(timeline.read_text())['scenes'] if timeline.exists() else []


def scene_of(frame):
    for sc in scenes:
        if sc['start_frame'] <= frame < sc['end_frame']:
            return f"{sc['id']} {sc['name']}"
    return ''
files = sorted(src.glob('f*.png'))
rows = (len(files) + cols - 1) // cols
pad, label_h = 8, 50 if scenes else 30
head = 56 if title else 0
sheet = Image.new('RGB', (cols * (tw + pad) + pad, head + rows * (th + label_h + pad) + pad), (18, 18, 20))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
    small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
    big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
except OSError:
    font = small = big = ImageFont.load_default()
if title:
    d.text((pad + 4, 14), title, fill=(255, 255, 255), font=big)
for i, f in enumerate(files):
    frame = int(f.stem[1:])
    x = pad + (i % cols) * (tw + pad)
    y = head + pad + (i // cols) * (th + label_h + pad)
    sheet.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + label_h))
    d.text((x + 4, y + 5), f'f{frame}  {frame / 30:.2f}s', fill=(255, 200, 80), font=font)
    if scenes:
        d.text((x + 4, y + 27), scene_of(frame), fill=(200, 200, 205), font=small)
sheet.save(out)
print(out, sheet.size)
