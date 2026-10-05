import { agency } from "../config/agency.js";
import { getDb } from "../lib/db.js";
import { handleCheckAvailability } from "../lib/handlers.js";
import { json, readSignedBody } from "../lib/retell-request.js";

// Retell custom function `check_availability`. Body: { name, call, args: { date, preferred_time? } }.
export async function POST(request: Request): Promise<Response> {
  const read = await readSignedBody(request);
  if ("error" in read) return read.error;
  try {
    return json(await handleCheckAvailability(read.body.args ?? {}, { db: getDb(), now: new Date(), cfg: agency }));
  } catch (err) {
    console.error("check-availability failed", err);
    return json({ error: "internal_error", message: "Le système de rendez-vous ne répond pas. Excuse-toi et propose un rappel." }, 500);
  }
}
