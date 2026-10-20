"""Writes a few 512x512 monochrome grain tiles used as a subtle overlay."""
import os, sys
import numpy as np
from PIL import Image

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)
for i in range(4):
    g = rng.normal(128, 38, (512, 512)).clip(0, 255).astype(np.uint8)
    Image.fromarray(g, "L").save(os.path.join(out, f"grain-{i}.png"), optimize=True)
