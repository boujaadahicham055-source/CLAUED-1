"""Extracts exact frames (by index) from a rendered video as fNNN.png.
usage: python3 scripts/frames_from_video.py <video.mp4> <out_dir> <frame> [<frame> ...]
"""
import subprocess
import sys
from pathlib import Path

video, out = sys.argv[1], Path(sys.argv[2])
frames = [int(f) for f in sys.argv[3:]]
out.mkdir(parents=True, exist_ok=True)
for f in frames:
    subprocess.run(
        ['ffmpeg', '-v', 'error', '-y', '-i', video, '-vf', f'select=eq(n\\,{f})', '-vsync', '0', '-frames:v', '1', str(out / f'f{f:03d}.png')],
        check=True,
    )
print(f'extracted {len(frames)} frames to {out}')
