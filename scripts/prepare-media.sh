#!/usr/bin/env bash
# Builds the render proxy from the original product footage.
#  - 2x Lanczos upscale (576x768 -> 1152x1536) + light unsharp, so the browser
#    never has to bilinear-upscale the low-bitrate 576px source.
#  - Audio stream removed (-an): the original MP4 audio must never reach the mix.
#  - Short GOP for fast, frame-accurate seeking by <OffthreadVideo>.
# Also (re)generates the synthesized sound-design files.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="public/media/source_product.mp4"
OUT="public/media/source_hq.mp4"

ffmpeg -v error -y -i "$SRC" \
  -vf "scale=1152:1536:flags=lanczos,unsharp=5:5:0.55:5:5:0.0" \
  -an -c:v libx264 -preset slow -crf 13 -g 10 -pix_fmt yuv420p -movflags +faststart \
  "$OUT"

python3 scripts/make_sfx.py public/sfx

echo "Prepared: $OUT and public/sfx/*.wav"
