import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel
audio, out, model_name = sys.argv[1], sys.argv[2], sys.argv[3]
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
prompt = ("أخيب شعور هو شي نهار تفيق معطّل على الخدمة، وتجي باش تشعل الطوموبيل ديالك، والو! "
          "البطارية ما بغاتش تعاون. الوقاية خير من العلاج. بوستر، منفاخ، باور بانك، ضو LED. طلبو دابا من ماشري")
raw = subprocess.run(['ffmpeg','-v','error','-i',audio,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
pcm = np.frombuffer(raw, dtype=np.float32)
segs, info = model.transcribe(pcm, language="ar", word_timestamps=True, beam_size=5,
                              vad_filter=False, initial_prompt=prompt, condition_on_previous_text=False)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"start": w.start, "end": w.end, "word": w.word, "p": w.probability} for w in s.words]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
