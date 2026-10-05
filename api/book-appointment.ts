import { agency } from "../config/agency.js";
import { getDb } from "../lib/db.js";
import { handleBookAppointment } from "../lib/handlers.js";
import { json, readSignedBody } from "../lib/retell-request.js";

// Retell custom function `book_appointment`. Not idempotent: the tool is configured with max_retry 0.
export async function POST(request: Request): Promise<Response> {
  const read = await readSignedBody(request);
  if ("error" in read) return read.error;
  try {
    const callId = typeof read.body.call?.call_id === "string" ? read.body.call.call_id : null;
    return json(await handleBookAppointment(read.body.args ?? {}, callId, { db: getDb(), now: new Date(), cfg: agency }));
  } catch (err) {
    console.error("book-appointment failed", err);
    return json({ booked: false, error: "internal_error", message: "La réservation n'a pas pu être enregistrée. Excuse-toi et propose un rappel." }, 500);
  }
}
