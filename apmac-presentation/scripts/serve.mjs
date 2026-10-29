// Starts `vite preview` on the built deck and resolves once it answers.
import { spawn } from "node:child_process";
import path from "node:path";

export async function startPreview(port = 4173) {
  const root = new URL("..", import.meta.url).pathname;
  const proc = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "preview", "--port", String(port), "--strictPort"], {
    stdio: "ignore",
    cwd: root,
  });
  const url = `http://localhost:${port}/`;
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return { url, stop: () => proc.kill("SIGTERM") };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  proc.kill("SIGTERM");
  throw new Error("vite preview did not start");
}
