#!/usr/bin/env python3
"""Verify voice-over timing from the actual waveform.

1. Decodes public/media/voiceover.mp3 to 16 kHz mono with ffmpeg.
2. Builds a 10 ms RMS envelope and finds speech islands separated by
   >= 120 ms of signal below -40 dBFS.
3. Maps the 14 islands to the 14 transcript phrases (count must match).
4. Refines word onsets: each Whisper word start (data/asr_words_whisper_medium.json)
   is snapped to the deepest energy dip within +/-120 ms, so the onset lands
   on the actual inter-word gap rather than on the ASR estimate.
5. Writes data/audio_analysis.json and data/vo_waveform.png.

Run: python3 scripts/analyze_audio.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "public/media/voiceover.mp3"
WORDS = ROOT / "data/asr_words_whisper_medium.json"
OUT = ROOT / "data/audio_analysis.json"
FPS = 30
SR = 16000
HOP = 160  # 10 ms
THRESH_DB = -40.0
MIN_GAP = 12  # 120 ms

PHRASES = [
    "تخيّل تكون فشي بلاصة",
    "وطوموبيلتك ما بغاتش تديماري",
    "أو الرويضة نقصات فيها الريح",
    "مع هاد الجهاز",
    "عندك ديمارور للبطارية",
    "وگونفلور للرويضات",
    "وزيد عليهم باور بانك",
    "وضو ديال الطوارئ",
    "كل هادشي فجِهاز واحد",
    "تقدر تخليه ديما معاك فالطوموبيل",
    "الجهاز رجع للستوك",
    "والكمية محدودة",
    "طلبو دابا",
    "وما تخلّص حتى تجرّبو",
]


def envelope():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(VO), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float64) / 32768.0
    n = len(x) // HOP
    rms = np.sqrt((x[: n * HOP].reshape(n, HOP) ** 2).mean(axis=1))
    return x, 20 * np.log10(rms + 1e-9)


def speech_islands(db):
    voiced = db >= THRESH_DB
    islands, start, silent_run = [], None, 0
    for i, v in enumerate(voiced):
        if v:
            if start is None:
                start = i
            silent_run = 0
        elif start is not None:
            silent_run += 1
            if silent_run >= MIN_GAP:
                islands.append((start, i - silent_run + 1))
                start, silent_run = None, 0
    if start is not None:
        islands.append((start, len(db) - silent_run))
    return [(a / 100.0, b / 100.0) for a, b in islands]


def snap_onset(db, t, lo, hi):
    """Snap an ASR word start to the deepest energy dip within +/-120 ms."""
    a = max(int(round((t - 0.12) * 100)), int(round(lo * 100)))
    b = min(int(round((t + 0.12) * 100)), int(round(hi * 100)))
    if b - a < 3:
        return t
    i = a + int(np.argmin(db[a:b]))
    return i / 100.0


def main():
    x, db = envelope()
    duration = len(x) / SR
    islands = speech_islands(db)
    assert len(islands) == len(PHRASES), f"expected {len(PHRASES)} speech islands, got {len(islands)}"
    words = json.loads(WORDS.read_text())

    phrases = []
    for idx, ((s, e), text) in enumerate(zip(islands, PHRASES)):
        ws = [w for w in words if s - 0.25 <= w["s"] < e]
        refined = []
        for j, w in enumerate(ws):
            onset = s if j == 0 else snap_onset(db, w["s"], s, e)
            refined.append({"asr": w["w"], "asrStart": w["s"], "onset": round(onset, 2), "onsetFrame": int(round(onset * FPS))})
        phrases.append({
            "id": f"P{idx + 1:02d}",
            "text": text,
            "start": s,
            "end": e,
            "startFrame": int(np.floor(s * FPS)),
            "endFrame": int(np.ceil(e * FPS)),
            "words": refined,
        })

    OUT.write_text(json.dumps({
        "source": "public/media/voiceover.mp3",
        "durationSec": round(duration, 3),
        "durationFrames": int(np.ceil(duration * FPS)),
        "method": f"10ms RMS envelope, speech >= {THRESH_DB} dBFS, pauses >= {MIN_GAP * 10} ms; word onsets = Whisper(medium) starts snapped to local energy minima",
        "phrases": phrases,
    }, ensure_ascii=False, indent=1))

    # waveform strip with phrase boundaries, for visual verification
    W, H = 2400, 360
    img = Image.new("RGB", (W, H), (14, 16, 20))
    d = ImageDraw.Draw(img)
    px_per_s = W / duration
    for p in phrases:
        d.rectangle([p["start"] * px_per_s, 0, p["end"] * px_per_s, H], fill=(28, 40, 30))
    norm = np.clip((db + 70) / 70, 0, 1)
    for i, v in enumerate(norm):
        X = i / 100.0 * px_per_s
        h = v * (H / 2 - 20)
        d.line([(X, H / 2 - h), (X, H / 2 + h)], fill=(200, 255, 60))
    for p in phrases:
        for w in p["words"]:
            X = w["onset"] * px_per_s
            d.line([(X, H - 40), (X, H)], fill=(255, 255, 255))
        d.text((p["start"] * px_per_s + 3, 6), f'{p["id"]} {p["startFrame"]}-{p["endFrame"]}', fill=(255, 255, 255))
    for s in range(int(duration) + 1):
        d.text((s * px_per_s + 2, H - 14), f"{s}s", fill=(150, 150, 150))
    img.save(ROOT / "data/vo_waveform.png")

    for p in phrases:
        ws = " | ".join(f'{w["asr"]}@{w["onset"]:.2f}(f{w["onsetFrame"]})' for w in p["words"])
        print(f'{p["id"]} {p["start"]:6.2f}-{p["end"]:6.2f}  f{p["startFrame"]:3d}-f{p["endFrame"]:3d}  {ws}')


if __name__ == "__main__":
    main()
