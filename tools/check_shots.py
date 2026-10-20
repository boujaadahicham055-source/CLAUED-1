"""Static checks on src/data/edit.ts: each shot's source range must sit inside one
source segment, and shots must not overlap on the timeline.

Usage: python3 tools/check_shots.py
"""
import os, re, sys

src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/data/edit.ts")).read()
segs = [(float(a), float(b), n) for a, b, n in re.findall(r"\[([\d.]+), ([\d.]+), '([^']+)'\]", src)]
end = float(re.search(r"END_SECONDS = ([\d.]+)", src).group(1))
shots = []
for m in re.finditer(r"shot\(\{id: '([^']+)', from: ([\d.]+), to: ([\w.]+), src: ([\d.]+), rate: ([\d.]+)", src):
    sid, a, b, s, r = m.groups()
    b = end if b == "END_SECONDS" else float(b)
    shots.append((sid, float(a), b, float(s), float(r)))

ok = True
for sid, a, b, s, r in shots:
    # Remotion: trimBefore is whole composition frames; the last displayed frame is
    # one frame before the shot's end.
    s = round(s * 30) / 30
    e = s + ((round(b * 30) - round(a * 30) - 1) / 30) * r
    seg = next((g for g in segs if g[0] - 1e-6 <= s and e <= g[1] + 1e-6), None)
    status = f"in [{seg[0]:.2f}-{seg[1]:.2f}] {seg[2]}" if seg else "OUTSIDE any source segment"
    ok &= seg is not None
    print(f"{sid:4s} t {a:6.2f}-{b:6.2f}  src {s:6.3f}-{e:6.3f} x{r:<5} {status}")
timeline = sorted((a, b, sid) for sid, a, b, _, _ in shots)
for (a1, b1, s1), (a2, b2, s2) in zip(timeline, timeline[1:]):
    if a2 < b1 - 1e-6:
        ok = False
        print(f"overlap: {s1} and {s2}")
# A caption must not become visible over the shot *before* the cut its first word sits
# on (reveals start a few frames ahead of the onset): if a cut falls between a cue's
# `in` and its first word, the cue has to start at that cut.
import json
caps = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../captions.json")))
cuts = sorted({a for _, a, _, _, _ in shots} | {b for _, _, b, _, _ in shots})
for c in caps["cues"]:
    first = min(t["at"] for line in c["lines"] for t in line)
    f_in, f_first = round(c["in"] * 30), round(first * 30)
    early = [x for x in cuts if f_in < round(x * 30) <= f_first + 1]
    if early:
        ok = False
        print(f'caption {c["id"]}: visible from {c["in"]} but its first word ({first}) follows the cut at {early[-1]}')
print("OK" if ok else "FAILED")
sys.exit(0 if ok else 1)
