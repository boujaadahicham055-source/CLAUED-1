// Business handlers behind the /api endpoints. They take the already verified Retell
// payload, so they are tested without HTTP or signatures.

import { DateTime } from "luxon";
import type { AgencyConfig } from "../config/agency.js";
import {
  advisorFor,
  alternativeSlots,
  bookingWindow,
  checkAvailability,
  checkSlot,
  spokenSlot,
  type AvailabilityResult,
  type Slot,
} from "./availability.js";
import type { Db } from "./db.js";

type Ctx = { db: Db; now: Date; cfg: AgencyConfig };

async function bookedSet(db: Db, from: string, to: string): Promise<Set<number>> {
  return new Set((await db.bookedSlotStarts(from, to)).map((s) => Date.parse(s)));
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const s = String(v).trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : undefined;
}

function int(v: unknown, min: number, max: number): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseInt(v, 10) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

/** Keeps a leading + and digits; 8 to 15 digits covers Moroccan and international numbers. */
export function normalizePhone(v: unknown): string | undefined {
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const s = String(v).trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return (s.startsWith("+") || s.startsWith("00") ? "+" : "") + (s.startsWith("00") ? digits.slice(2) : digits);
}

function describeSlots(slots: Slot[]): string {
  return slots.length ? slots.map((s) => s.spoken).join(", ") : "aucune alternative trouvée";
}

export async function handleCheckAvailability(args: Record<string, any>, ctx: Ctx): Promise<AvailabilityResult> {
  const window = bookingWindow(args.date, ctx.now, ctx.cfg);
  const booked = await bookedSet(ctx.db, window.from, window.to);
  return checkAvailability({
    date: typeof args.date === "string" ? args.date : undefined,
    preferredTime: typeof args.preferred_time === "string" ? args.preferred_time : undefined,
    now: ctx.now,
    booked,
    cfg: ctx.cfg,
  });
}

export type BookingResult =
  | {
      booked: true;
      appointment_id: string;
      slot_start_iso: string;
      spoken_slot: string;
      advisor: string;
      message: string;
    }
  | {
      booked: false;
      error: "invalid_input" | "invalid_slot" | "slot_taken";
      reason?: string;
      missing_or_invalid?: string[];
      alternatives?: Slot[];
      message: string;
    };

export async function handleBookAppointment(
  args: Record<string, any>,
  callId: string | null,
  ctx: Ctx,
): Promise<BookingResult> {
  const { db, now, cfg } = ctx;
  const fullName = str(args.full_name, 100);
  const phone = normalizePhone(args.phone);
  const destination = str(args.destination, 200);
  const travelers = int(args.travelers, 1, 99);
  const notes = str(args.notes, 1000);

  const invalid: string[] = [];
  if (!fullName || fullName.length < 2) invalid.push("full_name");
  if (!phone) invalid.push("phone");
  if (typeof args.slot_start_iso !== "string") invalid.push("slot_start_iso");
  if (invalid.length) {
    return {
      booked: false,
      error: "invalid_input",
      missing_or_invalid: invalid,
      message: `Réservation non faite : information manquante ou invalide (${invalid.join(", ")}). Redemande-la au client.`,
    };
  }

  const slot = checkSlot(args.slot_start_iso, now, cfg);
  if (!slot.ok) {
    const around = DateTime.fromISO(String(args.slot_start_iso), { setZone: true });
    const from = around.isValid ? around : DateTime.fromJSDate(now);
    const window = bookingWindow(from.setZone(cfg.timezone).toISODate()!, now, cfg);
    const alternatives = alternativeSlots(from, now, await bookedSet(db, window.from, window.to), cfg);
    return {
      booked: false,
      error: "invalid_slot",
      reason: slot.reason,
      alternatives,
      message: `Ce créneau n'est pas réservable (${slot.reason}). Propose plutôt : ${describeSlots(alternatives)}.`,
    };
  }

  const advisor = advisorFor(slot.start, cfg);
  const startIso = slot.start.toUTC().toISO()!;
  const inserted = await db.insertAppointment({
    slotStart: startIso,
    slotEnd: slot.end.toUTC().toISO()!,
    advisor,
    fullName: fullName!,
    phone: phone!,
    destination: destination ?? null,
    travelers: travelers ?? null,
    notes: notes ?? null,
    callId,
  });

  if (!inserted.ok) {
    const window = bookingWindow(slot.start.toISODate()!, now, cfg);
    const alternatives = alternativeSlots(slot.start, now, await bookedSet(db, window.from, window.to), cfg);
    return {
      booked: false,
      error: "slot_taken",
      alternatives,
      message: `Ce créneau vient d'être pris. Alternatives : ${describeSlots(alternatives)}.`,
    };
  }

  try {
    await db.upsertLead({
      callId,
      fullName,
      phone,
      destination,
      travelers,
      notes,
      booked: true,
      appointmentId: inserted.id,
    });
  } catch (err) {
    // The appointment exists; a lead write failure must not make the agent say it failed.
    console.error("lead upsert after booking failed", err);
  }

  const spoken = spokenSlot(slot.start);
  return {
    booked: true,
    appointment_id: inserted.id,
    slot_start_iso: slot.start.toISO({ suppressMilliseconds: true })!,
    spoken_slot: spoken,
    advisor,
    message: `Rendez-vous confirmé pour ${fullName} le ${spoken} avec ${advisor}.`,
  };
}

const msToIso = (v: unknown) => (typeof v === "number" ? new Date(v).toISOString() : undefined);

/** Stores call_ended / call_analyzed events. Other events are acknowledged and ignored. */
export async function handleWebhook(body: Record<string, any>, db: Db): Promise<void> {
  const call = body.call;
  if (!call?.call_id || (body.event !== "call_ended" && body.event !== "call_analyzed")) return;

  const analysis = call.call_analysis ?? {};
  const custom = (analysis.custom_analysis_data ?? {}) as Record<string, any>;

  await db.upsertCallLog({
    callId: call.call_id,
    agentId: call.agent_id,
    callStatus: call.call_status,
    startTimestamp: msToIso(call.start_timestamp),
    endTimestamp: msToIso(call.end_timestamp),
    durationMs: typeof call.duration_ms === "number" ? call.duration_ms : undefined,
    disconnectionReason: call.disconnection_reason,
    transcript: call.transcript,
    callSummary: analysis.call_summary,
    userSentiment: analysis.user_sentiment,
    customAnalysis: body.event === "call_analyzed" ? custom : undefined,
    callCost: call.call_cost,
    metadata: call.metadata,
  });

  if (body.event === "call_analyzed") {
    await db.upsertLead({
      callId: call.call_id,
      destination: str(custom.destination, 200),
      travelDates: str(custom.travel_dates, 200),
      travelers: int(custom.travelers, 1, 99),
      budgetRange: str(custom.budget_range, 200),
      // Only ever set to true here: the booking endpoint is the source of truth.
      booked: custom.booked === true ? true : undefined,
    });
  }
}
