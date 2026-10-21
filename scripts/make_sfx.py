"""Synthesizes the ad's minimal sound design (no third-party samples, so no licensing).

whoosh.wav  - short band-swept air for selected text/transition entrances
impact.wav  - soft low thump for the product reveal and the "4" payoff
swell.wav   - gentle rising air that leads into the product reveal
tick.wav    - tiny transient for the CTA button landing
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def one_pole_lowpass(x, cutoff_hz):
    """Time-varying one-pole lowpass; cutoff_hz may be an array."""
    cutoff = np.broadcast_to(cutoff_hz, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def fade(n, attack, release):
    env = np.ones(n)
    a = int(attack * SR)
    r = int(release * SR)
    env[:a] = np.linspace(0, 1, a) ** 2
    env[n - r:] *= np.linspace(1, 0, r) ** 2
    return env


def normalize(x, peak_db=-3.0):
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


def whoosh(dur=0.42):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    sweep = 500 + 5200 * np.sin(np.pi * t) ** 1.5
    band = one_pole_lowpass(noise, sweep) - one_pole_lowpass(noise, sweep * 0.25)
    env = np.sin(np.pi * t ** 0.7) ** 2
    return normalize(band * env * fade(n, 0.005, 0.03))


def swell(dur=0.9):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    sweep = 300 + 4200 * t ** 2
    band = one_pole_lowpass(noise, sweep) - one_pole_lowpass(noise, 120)
    env = t ** 2.2 * fade(n, 0.01, 0.06)
    return normalize(band * env)


def impact(dur=1.1):
    n = int(dur * SR)
    t = np.arange(n) / SR
    freq = 38 + 34 * np.exp(-t * 9)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 4.2)
    click_noise = one_pole_lowpass(rng.standard_normal(n), 1800) * np.exp(-t * 60) * 0.5
    x = np.tanh(1.6 * (body + click_noise))
    return normalize(x * fade(n, 0.002, 0.15), -2.0)


def tick(dur=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + 0.4 * np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 60)
    return normalize(x * fade(n, 0.0005, 0.01), -6.0)


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "public/sfx")
    out.mkdir(parents=True, exist_ok=True)
    write(out / "whoosh.wav", whoosh())
    write(out / "swell.wav", swell())
    write(out / "impact.wav", impact())
    write(out / "tick.wav", tick())
    print("wrote", sorted(p.name for p in out.glob("*.wav")))
