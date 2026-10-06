import Retell from "retell-sdk";
import { agency } from "../config/agency.js";
import { getDb } from "../lib/db.js";
import { json } from "../lib/retell-request.js";
import { clientIp, createDemoWebCall, isSameOrigin } from "../lib/web-call.js";

// Called by the demo page. Returns a short lived web call token; the Retell API key stays here.
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers, request.url)) return json({ error: "forbidden" }, 403);
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  if (!apiKey || !agentId) return json({ error: "not_configured", message: "Démo non configurée." }, 503);
  try {
    const result = await createDemoWebCall({
      db: getDb(),
      retell: new Retell({ apiKey }),
      agentId,
      ip: clientIp(request.headers),
      salt: agentId,
      now: new Date(),
      cfg: agency,
    });
    return json(result.body, result.ok ? 200 : result.status);
  } catch (err) {
    console.error("create-web-call failed", err);
    return json({ error: "internal_error", message: "Impossible de démarrer l'appel pour le moment." }, 502);
  }
}
