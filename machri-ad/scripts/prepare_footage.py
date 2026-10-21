#!/usr/bin/env python3
"""Build the per-shot clips the composition plays, from timeline.json.

For every shot (and grid tile) it:
  * trims the inclusive source frame range from public/media/source_footage.mp4
  * optionally crops (source pixel coordinates)
  * retimes to the exact clip length; when the length differs from the source
    range it uses motion-compensated interpolation (minterpolate) so slow
    motion stays smooth instead of repeating frames
  * upscales with Lanczos + light unsharp (source is 576x1024)
  * encodes H.264 WITHOUT an audio track, so no source audio can leak

It also validates the edit: every composition frame must be covered.

Run: python3 scripts/prepare_footage.py [--only sh05,sh14]
"""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = json.loads((ROOT / "timeline.json").read_text())
SRC = ROOT / "public" / TIMELINE["meta"]["sourceFootage"]["file"]
OUT_DIR = ROOT / "public" / "clips"
FPS = TIMELINE["meta"]["fps"]


def vf_chain(source, out_frames, width, height):
    start, end = source["start"], source["end"]
    src_frames = end - start + 1
    f = [f"trim=start_frame={start}:end_frame={end + 1}", "setpts=PTS-STARTPTS"]
    crop = source.get("crop")
    if crop:
        f.append(f"crop={crop['w']}:{crop['h']}:{crop['x']}:{crop['y']}")
    if out_frames != src_frames:
        # Stretch so the last source frame lands exactly on the last output frame.
        k = (out_frames - 1) / (src_frames - 1)
        f.append(f"setpts=PTS*{k:.6f}")
        f.append(f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none")
    f.append(f"scale={width}:{height}:flags=lanczos")
    f.append("unsharp=5:5:0.45:5:5:0.0")
    f.append("tpad=stop_mode=clone:stop=4")  # guard only; output is cut at out_frames
    f.append(f"fps={FPS}")
    f.append("format=yuv420p")
    return ",".join(f)


def render(name, source, out_frames, width, height):
    out = OUT_DIR / f"{name}.mp4"
    cmd = [
        "ffmpeg", "-v", "error", "-y", "-i", str(SRC),
        "-vf", vf_chain(source, out_frames, width, height),
        "-frames:v", str(out_frames), "-an",
        "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-g", "10",
        "-movflags", "+faststart", str(out),
    ]
    subprocess.run(cmd, check=True)
    n = int(subprocess.run(
        ["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
         "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(out)],
        capture_output=True, text=True, check=True).stdout.strip())
    has_audio = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(out)],
        capture_output=True, text=True).stdout.strip()
    assert n == out_frames, f"{name}: expected {out_frames} frames, got {n}"
    assert not has_audio, f"{name}: unexpected audio stream"
    src_frames = source["end"] - source["start"] + 1
    print(f"{name:14s} src {source['start']:3d}-{source['end']:3d} ({src_frames:2d}f) -> {out_frames:3d}f "
          f"speed {src_frames / out_frames:.2f}x {width}x{height}")


def validate():
    total = TIMELINE["meta"]["durationInFrames"]
    covered = [False] * total
    for s in TIMELINE["shots"]:
        assert s["clipFrames"] >= s["duration"], f"{s['id']} clip shorter than its slot"
        for f in range(s["from"], min(total, s["from"] + s["duration"])):
            covered[f] = True
    g = TIMELINE["grid"]
    for f in range(g["from"], g["from"] + g["duration"]):
        covered[f] = True
    gaps = [i for i, c in enumerate(covered) if not c]
    assert not gaps, f"uncovered composition frames: {gaps[:10]}..."
    last = max(s["from"] + s["duration"] for s in TIMELINE["shots"])
    assert last == total, f"last shot ends at {last}, composition is {total}"
    print(f"edit validated: frames 0-{total - 1} fully covered")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    only = set(filter(None, args.only.split(",")))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    validate()
    W, H = TIMELINE["meta"]["width"], TIMELINE["meta"]["height"]
    for s in TIMELINE["shots"]:
        if not only or s["id"] in only:
            render(s["id"], s["source"], s["clipFrames"], W, H)
    g = TIMELINE["grid"]
    for t in g["tiles"]:
        if "shotClip" in t:  # tile plays a full-frame shot clip (seamless expand hand-off)
            continue
        name = f"tile_{t['id']}"
        if not only or name in only:
            render(name, t["source"], g["duration"], W // 2, H // 2)


if __name__ == "__main__":
    main()
