"""Refine Whisper word timings against measured pauses in the voice-over.

Whisper (large-v3, word_timestamps=True) tends to stretch a word across the pause
that precedes it. Pauses measured with ffmpeg silencedetect (-40 dB, >= 0.15 s) are
treated as ground truth: the audio is split into speech "islands" between pauses,
each word is assigned to the island it overlaps most, then clamped inside it.

Usage: python3 tools/refine_timeline.py <whisper.json> <silences.txt> <total_s> <out.json>
"""
import json, re, sys

# Darija display spellings (Whisper leans to MSA). Spoken audio is unchanged.
FIX = {
    "أخيي": "أخيب", "بشعور": "شعور", "مصارف": "مصاريف", "لها؟": "ليها؟",
    "لك": "ليك", "تستفد": "تستافد", "في": "ف", "دابة": "دابا", "طلبوا": "طلبو",
    "وجربوا": "وجرّبو", "تخلص": "تخلّص", "تخيل": "تخيّل", "وسهل": "وساهل",
    "معك": "معاك", "الطو": "الطوموبيل",
}
MERGE_INTO_PREVIOUS = {"موبيل"}  # Whisper split "الطوموبيل" in two tokens
# Manual review: "هاد" (ASR 28.58) is the first half of "هادشي" and is spoken after
# the 28.76-28.96 pause that follows "تخيّل!", not before it.
FORCE_NEXT_ISLAND = {("هاد", 28.58)}
# Manual review: a 0.18 s dip (< -35 dB, too short/quiet for the -40 dB pass) at
# 30.52-30.66 separates "واحد" from "عملي".
FORCE_START = {("عملي", 30.46): 30.66}

whisper = json.load(open(sys.argv[1]))
total = float(sys.argv[3])
txt = open(sys.argv[2]).read()
pauses = [(float(a), float(a) + float(d)) for a, d in
          re.findall(r"silence_start: ([0-9.]+).*?silence_duration: ([0-9.]+)", txt, re.S)]

SPEECH_START = 0.15  # first 10 ms frame above -35 dB (tools/envelope output)
islands, cur = [], SPEECH_START
for a, b in pauses:
    if a > cur:
        islands.append([cur, a])
    cur = b
if cur < total:
    islands.append([cur, total])

def overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))

words = []
for w in (w for s in whisper for w in s["words"]):
    tok = w["word"].strip()
    if tok in MERGE_INTO_PREVIOUS:
        words[-1]["asr_end"] = round(w["end"], 2)
        continue
    i = max(range(len(islands)), key=lambda k: overlap(w["start"], w["end"], *islands[k]))
    if (tok, round(w["start"], 2)) in FORCE_NEXT_ISLAND:
        i += 1
    lo, hi = islands[i]
    s, e = min(max(w["start"], lo), hi), min(max(w["end"], lo), hi)
    s = FORCE_START.get((tok, round(w["start"], 2)), s)
    words.append({"word": FIX.get(tok, tok), "start": s, "end": e, "island": i,
                  "asr_start": round(w["start"], 2), "asr_end": round(w["end"], 2),
                  "confidence": round(w["p"], 2)})

# Within each island: first word starts at the island onset, last word ends at its
# offset, and words never overlap.
for i, (lo, hi) in enumerate(islands):
    ws = [w for w in words if w["island"] == i]
    if not ws:
        continue
    ws[0]["start"], ws[-1]["end"] = lo, hi
    for a, b in zip(ws, ws[1:]):
        b["start"] = max(b["start"], a["start"] + 0.05)
        a["end"] = min(a["end"], b["start"]) if (a["word"], b["word"]) == ("واحد", "عملي") else b["start"]
for w in words:
    w["start"], w["end"] = round(w["start"], 2), round(w["end"], 2)

phrases = []
for i, (lo, hi) in enumerate(islands):
    ws = [w["word"] for w in words if w["island"] == i]
    if ws:
        phrases.append({"start": round(lo, 2), "end": round(hi, 2), "text": " ".join(ws)})

json.dump({"source": "Whisper large-v3 word timestamps, clamped to ffmpeg silencedetect "
                     "(-40 dB, 0.15 s) speech islands",
           "phrases": phrases, "words": words,
           "pauses": [[round(a, 3), round(b, 3)] for a, b in pauses]},
          open(sys.argv[4], "w"), ensure_ascii=False, indent=1)
for p in phrases:
    print(f'{p["start"]:6.2f}-{p["end"]:6.2f}  {p["text"]}')
