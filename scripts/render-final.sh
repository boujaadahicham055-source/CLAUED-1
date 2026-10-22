#!/usr/bin/env bash
# Final render: Remotion renders the picture (PNG frames -> H.264, BT.709 limited range)
# and writes the audio mix losslessly to a separate WAV; ffmpeg then encodes the AAC
# once and muxes it with an MP4 edit list, so encoder priming does not delay the
# narration (Remotion's own AAC path left a 2048-sample / 42.7 ms offset).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out deliverables

npx remotion render src/index.ts MachriAd out/final_video.mp4 \
  --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 \
  --image-format=png --separate-audio-to=out/final_mix.wav "$@"

ffmpeg -v error -y -i out/final_video.mp4 -i out/final_mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart deliverables/MACHRI_FINAL_AD.mp4

echo "Wrote deliverables/MACHRI_FINAL_AD.mp4"
