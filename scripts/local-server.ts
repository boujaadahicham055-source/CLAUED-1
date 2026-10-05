// Local stand-in for Vercel: serves the /api handlers on http://localhost:3000.
// Uses an in-memory Postgres (PGlite) with the real migration unless SUPABASE_URL is set.
// Usage: RETELL_API_KEY=... npm run local

import { createServer } from "node:http";
import { setDb } from "../lib/db.js";

const routes: Record<string, () => Promise<{ POST: (r: Request) => Promise<Response> }>> = {
  "/api/check-availability": () => import("../api/check-availability.js"),
  "/api/book-appointment": () => import("../api/book-appointment.js"),
  "/api/retell-webhook": () => import("../api/retell-webhook.js"),
};

if (!process.env.SUPABASE_URL) {
  const { createPgliteDb } = await import("../tests/helpers/pglite-db.js");
  setDb((await createPgliteDb()).db);
  console.log("Using in-memory PGlite database");
}

const port = Number(process.env.PORT ?? 3000);
createServer(async (req, res) => {
  const route = routes[req.url ?? ""];
  if (!route || req.method !== "POST") {
    res.writeHead(404).end();
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
