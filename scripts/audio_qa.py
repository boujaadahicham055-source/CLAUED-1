"""Audio QA for the rendered ad.

Checks:
  1. Narration is the provided MP3, at offset 0, not time-stretched (cross-correlation).
  2. The original product-video soundtrack is absent (correlation against it ~ 0).
  3. No clipping (sample peak) and overall levels.
  4. The final words are not cut off (render audio continues past the VO's last speech).
usage: python3 scripts/audio_qa.py <render.mp4> <voiceover.mp3> <source_product.mp4> [sfx_frames_csv]
"""
import subprocess
import sys

import numpy as np

SR = 16000


def decode(path, sr=SR, channels=1, left_only=False):
    pick = ['-af', 'pan=mono|c0=c0'] if left_only else ['-ac', str(channels)]
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-vn', *pick, '-ar', str(sr), '-f', 'f32le', '-'],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32)


def best_lag(a, b, max_lag_s=1.0):
    """Lag (s) of b inside a and normalised correlation, via FFT over +-max_lag."""
    n = len(a) + len(b)
    nfft = 1 << (n - 1).bit_length()
    fa = np.fft.rfft(a, nfft)
    fb = np.fft.rfft(b, nfft)
    xc = np.fft.irfft(fa * np.conj(fb), nfft)
    m = int(max_lag_s * SR)
    cand = np.concatenate([xc[:m], xc[-m:]])
    lags = np.concatenate([np.arange(m), np.arange(-m, 0)])
    k = int(np.argmax(np.abs(cand)))
    norm = np.sqrt(np.sum(a ** 2) * np.sum(b ** 2)) + 1e-12
    return lags[k] / SR, cand[k] / norm


render, vo_path, src_path = sys.argv[1:4]
mix = decode(render, left_only=True)  # one channel: compare sample-for-sample with the mono VO
vo = decode(vo_path)
src = decode(src_path)
L = min(len(mix), len(vo))

lag, corr = best_lag(mix[:L], vo[:L])
print(f'render audio duration      : {len(mix) / SR:.3f} s')
print(f'voice-over duration        : {len(vo) / SR:.3f} s')
print(f'VO alignment               : lag {lag * 1000:+.1f} ms, normalised correlation {corr:.3f}')

# Residual after removing the lag-compensated VO at its best gain -> what remains is SFX (+ codec noise)
k = int(round(lag * SR))
seg_mix = mix[max(k, 0):][: len(vo)]
seg_vo = vo[max(-k, 0):][: len(seg_mix)]
seg_mix = seg_mix[: len(seg_vo)]
gain = float(np.dot(seg_mix, seg_vo) / np.dot(seg_vo, seg_vo))
resid = seg_mix - gain * seg_vo
print(f'VO gain (left channel)     : {20 * np.log10(abs(gain)):+.2f} dB (0 dB = original level)')

Ls = min(len(mix), len(src))
_, corr_src = best_lag(mix[:Ls], src[:Ls], 0.5)
print(f'correlation w/ source audio: {corr_src:.3f} (≈0 means the original soundtrack is absent)')

stereo = decode(render, sr=48000, channels=2)
peak = float(np.max(np.abs(stereo)))
print(f'sample peak                : {20 * np.log10(peak + 1e-12):.2f} dBFS ({"CLIPPING" if peak >= 0.999 else "no clipping"})')
rms = float(np.sqrt(np.mean(mix ** 2)))
print(f'mix RMS                    : {20 * np.log10(rms):.1f} dBFS')
r = float(np.sqrt(np.mean(resid ** 2)))
print(f'non-VO residual RMS        : {20 * np.log10(r + 1e-12):.1f} dBFS (SFX + codec error)')
sfx_frames = [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else []
if sfx_frames:
    keep = np.ones(len(resid), bool)
    for f in sfx_frames:
        a0 = int(f / 30 * SR)
        keep[a0:a0 + int(1.2 * SR)] = False
    rr = float(np.sqrt(np.mean(resid[keep] ** 2)))
    print(f'residual outside SFX       : {20 * np.log10(rr + 1e-12):.1f} dBFS (≈ codec noise only -> narration untouched)')
L_ch = decode(render, sr=48000, channels=2).reshape(-1, 2)
diff = L_ch[:, 0] - L_ch[:, 1]
print(f'L-R difference RMS         : {20 * np.log10(np.sqrt(np.mean(diff ** 2)) + 1e-12):.1f} dBFS (dual-mono mix; non-zero only from AAC coding)')

# last speech energy in render vs VO
def last_active(x, thr_db=-40):
    hop = SR // 100
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(env + 1e-9)
    idx = np.where(db > thr_db)[0]
    return idx[-1] * hop / SR if len(idx) else 0

print(f'last audible audio (render): {last_active(mix):.2f} s ; VO last speech: {last_active(vo):.2f} s')
