#!/usr/bin/env python3
"""Quality assurance on the RENDERED file (not the source project).

Checks
  * container/streams: H.264 1080x1920 30 fps, frame count = timeline, exactly one audio stream
  * audio identity: output audio vs the ElevenLabs master (cross-correlation lag,
    correlation, residual energy = anything that is not the voice-over, silence after VO end)
  * black frames (blackdetect) and frozen segments (freezedetect)
  * caption-to-speech sync table (caption reveal frame vs verified word onset)
Outputs
  * out/MACHRI_QA_CONTACT_SHEET.png  (representative frames, labelled)
  * data/qa_report.json

Run: python3 scripts/qa.py [path/to/render.mp4]
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "timeline.json").read_text())
VIDEO = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/MACHRI_AD_FINAL.mp4"
VO = ROOT / "public" / T["meta"]["voiceover"]["file"]
FPS = T["meta"]["fps"]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def pcm(path, sr=16000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768.0


def probe():
    info = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(VIDEO)]).stdout)
    v = [s for s in info["streams"] if s["codec_type"] == "video"]
    a = [s for s in info["streams"] if s["codec_type"] == "audio"]
    vs = v[0]
    nb = int(run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                  "stream=nb_read_frames", "-of", "csv=p=0", str(VIDEO)]).stdout.strip())
    res = {
        "videoCodec": vs["codec_name"], "width": vs["width"], "height": vs["height"],
        "fps": vs["r_frame_rate"], "pixFmt": vs.get("pix_fmt"), "colorSpace": vs.get("color_space"),
        "colorRange": vs.get("color_range"), "frames": nb, "audioStreams": len(a),
        "audioCodec": a[0]["codec_name"] if a else None, "durationSec": float(info["format"]["duration"]),
        "sizeMB": round(int(info["format"]["size"]) / 1e6, 2),
    }
    res["pass"] = (res["videoCodec"] == "h264" and res["width"] == 1080 and res["height"] == 1920
                   and res["fps"] == "30/1" and nb == T["meta"]["durationInFrames"] and len(a) == 1)
    return res


def audio_identity():
    a, b = pcm(VO), pcm(VIDEO)
    n = len(a)

    def corr(lag):
        x = a[max(0, -lag): n - max(0, lag)]
        y = b[max(0, lag): max(0, lag) + len(x)]
        m = min(len(x), len(y))
        return float(np.dot(x[:m], y[:m]) / np.sqrt(np.dot(x[:m], x[:m]) * np.dot(y[:m], y[:m])))

    lags = range(-3200, 3201, 8)
    lag = max(lags, key=corr)
    lag = max(range(lag - 8, lag + 9), key=corr)
    c = corr(lag)
    seg = b[:n]
    gain = float(np.dot(a, seg) / np.dot(a, a))
    resid = seg - gain * a
    resid_db = 10 * np.log10(np.dot(a, a) / max(float(np.dot(resid, resid)), 1e-12))
    tail = b[n:]
    res = {
        "lagMs": lag / 16.0, "correlation": round(c, 5), "gain": round(gain, 3),
        "nonVoiceoverResidualDbBelowVO": round(resid_db, 1),
        "outputAudioSec": round(len(b) / 16000, 3), "voiceoverSec": round(n / 16000, 3),
        "peakAfterVoiceoverEnd": round(float(np.abs(tail).max()) if len(tail) else 0.0, 5),
    }
    res["pass"] = abs(res["lagMs"]) < 1 and c > 0.999 and resid_db > 35 and res["outputAudioSec"] >= res["voiceoverSec"]
    return res


def detect(filt, keys):
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(VIDEO), "-vf", filt, "-an", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return [dict(re.findall(r"(\w+):\s*([\d.]+)", line)) for line in out.splitlines() if keys in line]


def loudness():
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(VIDEO), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summ = out[out.rfind("Summary"):]
    i = re.search(r"I:\s*(-?[\d.]+) LUFS", summ)
    pk = re.search(r"Peak:\s*(-?[\d.]+) dBFS", summ)
    return {"integratedLUFS": float(i.group(1)) if i else None, "truePeakDBFS": float(pk.group(1)) if pk else None}


def sync_table():
    keys = {p["id"]: p["keys"] for p in T["speech"]}
    rows = []
    for c in T["captions"]:
        for line in c["lines"]:
            if "sync" not in line:
                continue
            onset = next(keys[p][line["sync"]] for p in c["phrase"].split(",") if line["sync"] in keys[p])
            rows.append({"caption": c["id"], "text": line["t"].replace("*", ""), "revealFrame": line["at"],
                         "word": line["sync"], "wordOnsetFrame": onset, "leadFrames": onset - line["at"]})
    for k in ("primary", "secondary"):
        e = T["cta"][k]
        onset = next(v[e["sync"]] for v in keys.values() if e["sync"] in v)
        rows.append({"caption": f"CTA-{k}", "text": e["text"], "revealFrame": e["at"], "word": e["sync"],
                     "wordOnsetFrame": onset, "leadFrames": onset - e["at"]})
    return rows


def frame_at(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(VIDEO), "-vf", f"select=eq(n\\,{f}),scale=270:480",
                          "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return Image.frombytes("RGB", (270, 480), raw)


def scene_of(f):
    best = None
    for s in T["shots"]:
        if s["from"] <= f < s["from"] + s["duration"]:
            best = s["scene"]
    g = T["grid"]
    if g["from"] <= f < g["from"] + g["duration"]:
        best = "E Four-in-one (grid)"
    return best or ""


def contact_sheet(path):
    picks = [
        (12, "hook"), (30, "hook"), (60, "dash"), (100, "won't start"), (160, "tyre"), (187, "reveal wipe"),
        (202, "reveal"), (236, "D1 battery"), (258, "D1 battery"), (296, "D2 inflator"), (350, "D3 power bank"),
        (385, "D4 light"), (403, "grid in"), (414, "4 services"), (427, "tile expands"), (446, "one device"),
        (500, "in the car"), (552, "back in stock"), (592, "limited"), (618, "CTA"), (650, "CTA"), (707, "final frame"),
        (5, "first frame"), (690, "hold"),
    ]
    picks.sort()
    cols, tw, th, bar = 6, 270, 480, 40
    rows = (len(picks) + cols - 1) // cols
    head = 70
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * 8, head + rows * (th + bar + 8) + 8), (12, 13, 16))
    d = ImageDraw.Draw(sheet)
    d.text((12, 14), "MACHRI — QA contact sheet (frames sampled from the rendered MP4)", font=ImageFont.truetype(FONT, 26), fill=(214, 255, 58))
    d.text((12, 44), f"{VIDEO.name} · 1080x1920 · 30 fps · {T['meta']['durationInFrames']} frames", font=ImageFont.truetype(FONT, 17), fill=(200, 200, 200))
    small = ImageFont.truetype(FONT, 15)
    for i, (f, note) in enumerate(picks):
        x = 8 + (i % cols) * (tw + 8)
        y = head + (i // cols) * (th + bar + 8)
        sheet.paste(frame_at(f), (x, y))
        d.rectangle([x, y + th, x + tw, y + th + bar], fill=(24, 26, 30))
        d.text((x + 6, y + th + 3), f"f{f} · {f / FPS:05.2f}s · {note}", font=small, fill=(255, 255, 255))
        d.text((x + 6, y + th + 21), scene_of(f), font=small, fill=(160, 160, 160))
    sheet.save(path)


def main():
    report = {"file": str(VIDEO.relative_to(ROOT)) if VIDEO.is_relative_to(ROOT) else str(VIDEO)}
    report["container"] = probe()
    report["audio"] = audio_identity()
    report["loudness"] = loudness()
    report["blackFrames"] = detect("blackdetect=d=0.03:pic_th=0.92:pix_th=0.08", "black_start")
    report["frozenSegments"] = detect("freezedetect=n=0.0008:d=0.3", "freeze_duration")
    report["captionSync"] = sync_table()
    sheet = VIDEO.parent / "MACHRI_QA_CONTACT_SHEET.png"
    contact_sheet(sheet)
    report["contactSheet"] = sheet.name
    report["pass"] = (report["container"]["pass"] and report["audio"]["pass"]
                      and not report["blackFrames"] and not report["frozenSegments"])
    (ROOT / "data/qa_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != "captionSync"}, ensure_ascii=False, indent=1))
    print("caption sync (lead = frames the text starts before the spoken word):")
    for r in report["captionSync"]:
        print(f"  {r['caption']:14s} reveal f{r['revealFrame']:3d}  word f{r['wordOnsetFrame']:3d}  lead {r['leadFrames']:+d}")


if __name__ == "__main__":
    main()
