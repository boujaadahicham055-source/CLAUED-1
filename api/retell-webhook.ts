import { getDb } from "../lib/db.js";
import { handleWebhook } from "../lib/handlers.js";
import { json, readSignedBody } from "../lib/retell-request.js";

// Retell agent webhook: stores call_ended and call_analyzed into call_logs and leads.
export async function POST(request: Request): Promise<Response> {
  const read = await readSignedBody(request);
  if ("error" in read) return read.error;
  try {
    await handleWebhook(read.body, getDb());
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("retell-webhook failed", err);
    return json({ error: "internal_error" }, 500);
  }
}
