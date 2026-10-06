// Local stand-in for Vercel: serves public/ and the /api handlers on http://localhost:3000.
// Uses an in-memory Postgres (PGlite) with the real migration unless SUPABASE_URL is set.
// Usage: RETELL_API_KEY=... npm run local

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { setDb } from "../lib/db.js";

const routes: Record<string, () => Promise<{ POST: (r: Request) => Promise<Response> }>> = {
  "/api/check-availability": () => import("../api/check-availability.js"),
  "/api/book-appointment": () => import("../api/book-appointment.js"),
  "/api/retell-webhook": () => import("../api/retell-webhook.js"),
  "/api/create-web-call": () => import("../api/create-web-call.js"),
};

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function serveStatic(url: string, res: import("node:http").ServerResponse) {
  const path = normalize(url.split("?")[0] === "/" ? "/index.html" : url.split("?")[0]);
  if (path.includes("..")) return res.writeHead(400).end();
  try {
    const body = await readFile(join("public", path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}

if (!process.env.SUPABASE_URL) {
  const { createPgliteDb } = await import("../tests/helpers/pglite-db.js");
  setDb((await createPgliteDb()).db);
  console.log("Using in-memory PGlite database");
}

const port = Number(process.env.PORT ?? 3000);
createServer(async (req, res) => {
  const route = routes[req.url ?? ""];
  if (!route) {
    if (req.method === "GET") return serveStatic(req.url ?? "/", res);
    res.writeHead(404).end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const response = await (await route()).POST(
    new Request(`http://localhost${req.url}`, { method: "POST", headers, body: Buffer.concat(chunks) }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`Local API on http://localhost:${port}`));
