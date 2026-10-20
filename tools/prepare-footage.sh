#!/usr/bin/env bash
# Builds the footage the Remotion project actually reads.
#   - audio stream dropped (-an): the original soundtrack can never reach the edit
#   - 2x motion-compensated frame interpolation (30 -> 60 fps) so slowed shots stay smooth
#   - Lanczos upscale 576x1024 -> 1080x1920 with light unsharp mask
#   - VP9/WebM so @remotion/media decodes natively in every Chromium build
#     (H.264 needs proprietary codecs that open-source Chromium may lack)
#   - short GOP for fast, frame-accurate seeking
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets-src/source.mp4
ffmpeg -v error -y -i "$SRC" -an \
  -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=8,scale=1080:1920:flags=lanczos,unsharp=5:5:0.55:5:5:0.0" \
  -c:v libvpx-vp9 -crf 16 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 -tile-columns 2 \
  -g 12 -pix_fmt yuv420p public/assets/footage_1080p60.webm
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate -of compact public/assets/footage_1080p60.webm

# Freeze-frame / feature-card stills, pulled from the upscaled footage (source seconds).
mkdir -p public/stills
still() { ffmpeg -v error -y -ss "$1" -i public/assets/footage_1080p60.webm -frames:v 1 -q:v 2 "public/stills/$2.jpg"; }
still 4.70 key-turn        # last key-turn frame before the cut (freeze for "والو!")
still 7.55 flat-tire       # last flat-tire frames (blurred backdrop for the cost pill)
still 0.25 device-front    # device front: display + clamps (power-bank card)
still 8.10 device-buttons  # hand-held device, light button visible (LED card)

# Film-grain tiles (procedural, generated here — no third-party asset).
python3 -I tools/make_grain.py public/grain
