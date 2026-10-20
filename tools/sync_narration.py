"""Copies the measured narration timeline (tools/asr/timeline.json) into captions.json.

Usage: python3 tools/sync_narration.py
"""
import json, os

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
timeline = json.load(open(os.path.join(root, "tools/asr/timeline.json")))
path = os.path.join(root, "captions.json")
captions = json.load(open(path))

captions["narration"] = {
    "audio": "public/assets/voiceover.mp3",
    "durationSeconds": 40.4375,
    "speechStart": timeline["phrases"][0]["start"],
    "speechEnd": timeline["phrases"][-1]["end"],
    "method": timeline["source"],
    "phrases": timeline["phrases"],
    "words": [{k: w[k] for k in ("word", "start", "end", "confidence")} for w in timeline["words"]],
    "pauses": timeline["pauses"],
}

# Every token anchor must coincide with a measured word onset (tolerance 0.15 s) unless
# it is an intentional on-screen-only word (see the cue's `note`) — catches typos in `at`.
onsets = [w["start"] for w in timeline["words"]]
for cue in captions["cues"]:
    for line in cue["lines"]:
        for tok in line:
            nearest = min(onsets, key=lambda o: abs(o - tok["at"]))
            if abs(nearest - tok["at"]) > 0.15:
                print(f'warning: {cue["id"]} "{tok["text"]}" at {tok["at"]} is {tok["at"] - nearest:+.2f}s from nearest onset {nearest}')

with open(path, "w") as f:
    json.dump(captions, f, ensure_ascii=False, indent=2)
print("captions.json narration updated:", len(captions["narration"]["words"]), "words,",
      len(captions["cues"]), "cues")
