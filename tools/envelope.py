import subprocess, sys, numpy as np
raw = subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
hop = 160  # 10 ms
n = len(x)//hop
rms = np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2,axis=1)+1e-12)
db = 20*np.log10(rms)
np.save(sys.argv[2], db)
print("frames", n, "max dB", db.max().round(1), "speech start(>-35dB):", np.argmax(db>-35)*0.01, "last speech:", (n-1-np.argmax(db[::-1]>-35))*0.01)
