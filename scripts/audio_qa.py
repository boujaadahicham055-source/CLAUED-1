"""Audio QA for the rendered ad.

Checks:
  1. Narration is the provided MP3, at offset 0, not time-stretched (cross-correlation).
  2. The original product-video soundtrack is absent (correlation against it ~ 0).
  3. No clipping (sample peak) and overall levels.
  4. The final words are not cut off (render audio continues past the VO's last speech).
usage: python3 scripts/audio_qa.py <render.mp4> <voiceover.mp3> <source_product.mp4>
"""
import subprocess
import sys

import numpy as np

SR = 16000


def decode(path, sr=SR, channels=1):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', str(channels), '-ar', str(sr), '-f', 'f32le', '-'],
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
mix = decode(render)
vo = decode(vo_path)
src = decode(src_path)
L = min(len(mix), len(vo))

lag, corr = best_lag(mix[:L], vo[:L])
print(f'render audio duration      : {len(mix) / SR:.3f} s')
print(f'voice-over duration        : {len(vo) / SR:.3f} s')
print(f'VO alignment               : lag {lag * 1000:+.1f} ms, normalised correlation {corr:.3f}')

# Residual after removing the VO at its best gain -> what remains is SFX (+ codec noise)
seg_mix = mix[:L]
seg_vo = vo[:L]
gain = float(np.dot(seg_mix, seg_vo) / np.dot(seg_vo, seg_vo))
resid = seg_mix - gain * seg_vo
print(f'VO gain in mix             : {20 * np.log10(abs(gain)):+.2f} dB (0 dB = untouched level)')

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

# last speech energy in render vs VO
def last_active(x, thr_db=-40):
    hop = SR // 100
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(env + 1e-9)
    idx = np.where(db > thr_db)[0]
    return idx[-1] * hop / SR if len(idx) else 0

print(f'last audible audio (render): {last_active(mix):.2f} s ; VO last speech: {last_active(vo):.2f} s')
