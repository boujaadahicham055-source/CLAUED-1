"""Automated QA for the rendered ad. Prints a report section per check; exits non-zero
if a hard requirement fails.

Usage: python3 -I tools/qa.py MACHRI_AD_FINAL.mp4 [contact_sheet.png]
"""
import json, re, subprocess, sys
import numpy as np

OUT = sys.argv[1]
SHEET = sys.argv[2] if len(sys.argv) > 2 else None
VO = "public/assets/voiceover.mp3"
SRC = "assets-src/source.mp4"
SR = 16000
failures = []


def run(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def pcm(path, start=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    if dur is not None:
        cmd += ["-t", str(dur)]
    # first channel only: ffmpeg's stereo->mono downmix would scale the level by sqrt(2)
    cmd += ["-i", path, "-vn", "-af", "pan=mono|c0=c0", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)


def check(name, ok, detail):
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: {detail}")
    if not ok:
        failures.append(name)


def xcorr_offset(a, b, max_lag):
    """Lag (samples) maximising correlation of b against a, and the normalised peak."""
    n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
    fa, fb = np.fft.rfft(a, n), np.fft.rfft(b, n)
    c = np.fft.irfft(fa * np.conj(fb), n)
    c = np.concatenate([c[-max_lag:], c[: max_lag + 1]])
    lag = int(np.argmax(np.abs(c))) - max_lag
    return lag, float(np.max(np.abs(c)) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


print("== Streams")
probe = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", OUT).stdout)
streams = probe["streams"]
v = [s for s in streams if s["codec_type"] == "video"]
a = [s for s in streams if s["codec_type"] == "audio"]
check("exactly one video + one audio stream", len(v) == 1 and len(a) == 1, f"{len(v)} video, {len(a)} audio")
v, a = v[0], a[0]
check("video codec H.264", v["codec_name"] == "h264", f"{v['codec_name']} ({v.get('profile')}, {v.get('pix_fmt')})")
check("pixel format yuv420p, BT.709 limited range",
      v.get("pix_fmt") == "yuv420p" and v.get("color_range") == "tv" and v.get("color_space") == "bt709",
      f"{v.get('pix_fmt')}, range {v.get('color_range')}, matrix {v.get('color_space')}, "
      f"transfer {v.get('color_transfer')}, primaries {v.get('color_primaries')}")
check("resolution 1080x1920 (9:16)", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
check("frame rate 30 fps", v["r_frame_rate"] == "30/1" and v["avg_frame_rate"] == "30/1", f"r={v['r_frame_rate']} avg={v['avg_frame_rate']}")
check("audio codec AAC", a["codec_name"] == "aac", f"{a['codec_name']} {a['sample_rate']} Hz, {a['channels']} ch, {int(a.get('bit_rate', 0)) // 1000} kb/s")
dur = float(probe["format"]["duration"])
vo_dur = float(json.loads(run("ffprobe", "-v", "error", "-show_format", "-of", "json", VO).stdout)["format"]["duration"])
tail = dur - vo_dur
check("duration = narration + short CTA tail", 0 < tail < 2.0, f"{dur:.3f} s (voice-over {vo_dur:.3f} s, tail {tail:.2f} s); {v.get('nb_frames')} frames")
print(f"       file size {int(probe['format']['size']) / 1e6:.1f} MB, video {int(v.get('bit_rate', 0)) / 1e6:.1f} Mb/s")

print("== Audio: voice-over identity")
out_a = pcm(OUT)
vo_a = pcm(VO)
lag, peak = xcorr_offset(out_a, vo_a, SR // 2)
check("voice-over aligned at t=0", abs(lag) <= SR * 0.005, f"offset {lag / SR * 1000:+.1f} ms, normalised correlation {peak:.4f}")
n = min(len(out_a), len(vo_a))
o, ref = out_a[:n], vo_a[:n]
gain = float(np.dot(o, ref) / np.dot(ref, ref))
resid = o - gain * ref
snr = 10 * np.log10(np.sum((gain * ref) ** 2) / (np.sum(resid ** 2) + 1e-12))
check("voice-over unaltered (no pitch/speed change, no added layer)", peak > 0.98 and snr > 20,
      f"gain {gain:.3f}, residual SNR {snr:.1f} dB (AAC coding noise only)")
win = SR // 2
env_out = [float(np.sqrt(np.mean(out_a[i:i + win] ** 2))) for i in range(0, len(out_a) - win, win)]
env_vo = [float(np.sqrt(np.mean(vo_a[i:i + win] ** 2))) for i in range(0, len(vo_a) - win, win)]
m = min(len(env_out), len(env_vo))
drop = [i * 0.5 for i in range(m) if env_vo[i] > 0.01 and env_out[i] < 0.5 * env_vo[i]]
check("voice-over plays start to end", not drop, f"{m} half-second windows compared; dropouts: {drop or 'none'}")
after = out_a[int(SR * (vo_dur + 0.05)):]
after_db = 20 * np.log10(np.sqrt(np.mean(after ** 2)) + 1e-9) if len(after) else -120
check("CTA tail is silent (no extra audio)", after_db < -60, f"{after_db:.1f} dBFS after {vo_dur:.2f} s")

print("== Audio: original source soundtrack absent")
src_a = pcm(SRC)
print(f"       source soundtrack RMS {20 * np.log10(np.sqrt(np.mean(src_a ** 2))):.1f} dBFS over {len(src_a) / SR:.1f} s (what would leak)")


def max_ncc(x, chunks):
    """Max locally-normalised cross-correlation of any chunk against any window of x."""
    best = 0.0
    csum = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    for ch in chunks:
        L = len(ch)
        nfft = 1 << int(np.ceil(np.log2(len(x) + L)))
        c = np.fft.irfft(np.fft.rfft(x, nfft) * np.conj(np.fft.rfft(ch, nfft)), nfft)[: len(x) - L + 1]
        local = np.sqrt(np.maximum(csum[L:] - csum[:-L], 1e-12))
        best = max(best, float(np.max(np.abs(c) / (local * np.linalg.norm(ch) + 1e-12))))
    return best


# Any shot could have carried any part of the source track: test 1 s chunks (0.5 s hop)
# of it against every position of the residual (output minus the voice-over).
chunks = [src_a[i:i + SR] for i in range(0, len(src_a) - SR, SR // 2)
          if np.sqrt(np.mean(src_a[i:i + SR] ** 2)) > 1e-3]
leak = max_ncc(resid, chunks)
# Self-test: the same detector on a simulated leak (source track 20 dB under the voice).
sim = o.copy()
seg = src_a[: min(len(src_a), len(sim) - 3 * SR)]
scale = np.sqrt(np.mean(ref ** 2)) / (np.sqrt(np.mean(seg ** 2)) + 1e-12) * 10 ** (-20 / 20)
sim[3 * SR: 3 * SR + len(seg)] += scale * seg
sim_leak = max_ncc(sim - gain * ref, chunks)
check("leak detector self-test (source mixed in at -20 dB is caught)", sim_leak > 0.5, f"NCC {sim_leak:.3f}")
check("no trace of the source soundtrack in the output", leak < 0.25,
      f"max NCC of {len(chunks)} source chunks vs. residual = {leak:.3f} (threshold 0.25)")
footage_audio = run("ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                    "-of", "csv=p=0", "public/assets/footage_1080p60.webm").stdout.strip()
check("footage master has no audio stream", footage_audio == "", "public/assets/footage_1080p60.webm: "
      + ("no audio stream" if footage_audio == "" else f"audio stream(s) {footage_audio}"))

print("== Picture")
bd = run("ffmpeg", "-v", "info", "-i", OUT, "-vf", "blackdetect=d=0.05:pix_th=0.06:pic_th=0.98", "-an", "-f", "null", "-").stderr
blacks = [l.split("blackdetect ")[1] for l in bd.splitlines() if "black_start" in l]
check("no black frames / gaps", not blacks, "; ".join(blacks) or "none (blackdetect d>=0.05 s, pix_th 0.06)")
fd = run("ffmpeg", "-v", "info", "-i", OUT, "-vf", "freezedetect=n=0.0008:d=0.5", "-an", "-f", "null", "-").stderr
freezes = [l.split("] ")[1] for l in fd.splitlines() if "freeze_" in l]
print("       freezedetect (n=0.0008, d>=0.5 s):", "; ".join(freezes) or "none")
sc = run("ffmpeg", "-v", "info", "-i", OUT, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-").stderr
cuts = [float(l.split("pts_time:")[1].split()[0]) for l in sc.splitlines() if "pts_time:" in l]
print(f"       detected cuts ({len(cuts)}):", " ".join(f"{c:.2f}" for c in cuts))
# Any picture change (scene score > 0.15) must coincide with a designed edit point:
# shot boundaries in src/data/edit.ts plus the card 03 -> 04 swap.
edit_src = open("src/data/edit.ts").read()
designed = {0.0}
for m in re.finditer(r"from: ([\d.]+), to: ([\d.]+|END_SECONDS)", edit_src):
    designed.add(float(m.group(1)))
    if m.group(2) != "END_SECONDS":
        designed.add(float(m.group(2)))
designed.add(next(c["in"] for c in json.load(open("captions.json"))["cues"] if c["id"] == "feature-4"))
sc2 = run("ffmpeg", "-v", "info", "-i", OUT, "-vf", "select='gt(scene,0.15)',showinfo", "-an", "-f", "null", "-").stderr
changes = [float(l.split("pts_time:")[1].split()[0]) for l in sc2.splitlines() if "pts_time:" in l]
unexpected = [c for c in changes if min(abs(c - d) for d in designed) > 1.2 / 30]  # edit points sit on exact frames
check("every picture change sits on a designed edit point", not unexpected,
      f"{len(changes)} changes (scene > 0.15) vs {len(designed)} edit points; unexpected: "
      + (", ".join(f"{c:.3f}s" for c in unexpected) or "none"))

print("== Sync measured from the rendered pixels")
# Accent-coloured (lime) words: find the frame where each reaches half of its visible
# pixel count and compare with the spoken onset of that word.
W, H = 270, 480
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", OUT, "-vf", f"scale={W}:{H}", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W, 3).astype(np.int16)
r, g, b = frames[..., 0], frames[..., 1], frames[..., 2]
lime = ((np.abs(r - 212) < 45) & (g > 215) & (b < 120)).sum(axis=(1, 2))
caps = json.load(open("captions.json"))
events = []
for c in caps["cues"]:
    for line in c["lines"]:
        for t in line:
            if t["style"] in ("key", "impact", "featureKey"):
                events.append((t["at"], t["text"]))
            if "strikeAt" in t and t is line[-1]:
                events.append((t["strikeAt"], "strike " + " ".join(x["text"] for x in line)))
events = sorted(set(events))
# Other accent animations that would pollute a measurement: feature index/segments,
# highlight rings, the four-services segments, pill icons, the CTA pill background.
others = [c["in"] for c in caps["cues"] if c["kind"] in ("feature", "pill")] + [18.04, 20.18, 26.42, 38.83]
offsets = []
for at, text in events:
    e = round(at * 30)
    near = [x for x, _ in events if x != at and abs(x - at) * 30 < 8] + [x for x in others if abs(x - at) * 30 < 8]
    if near:
        print(f"       {at:6.2f}s {text}: grouped with another accent animation within 8 frames — not measured alone")
        continue
    before, after = lime[max(0, e - 6)], lime[min(len(lime) - 1, e + 9)]
    if after - before < 40:
        print(f"       {at:6.2f}s {text}: no measurable accent change (overlaps another accent element)")
        continue
    half = before + 0.5 * (after - before)
    f = next(i for i in range(max(0, e - 6), e + 10) if lime[i] >= half)
    offsets.append(f - e)
    print(f"       {at:6.2f}s {text}: half-visible at frame {f} ({(f - e) / 30 * 1000:+.0f} ms vs spoken onset)")
check("accent words appear with their spoken words", bool(offsets) and min(offsets) >= -2 and max(offsets) <= 2,
      f"{len(offsets)} measured, offsets {min(offsets)}..{max(offsets)} frames (30 fps)")

if SHEET:
    run("ffmpeg", "-v", "error", "-y", "-i", OUT, "-vf",
        "fps=1,scale=216:384,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=7x6",
        "-frames:v", "1", SHEET)
    print("       contact sheet:", SHEET)

print("== Result:", "ALL HARD CHECKS PASSED" if not failures else f"FAILED: {failures}")
sys.exit(1 if failures else 0)
