// Pure availability logic: business hours minus booked slots, in the agency timezone.
// No I/O here, so every rule (closed days, past slots, timezone edges) is unit tested.

import { DateTime } from "luxon";
import type { AgencyConfig } from "../config/agency.js";

export type Slot = { start_iso: string; spoken: string };
export type DaySlots = { date: string; spoken_date: string; slots: Slot[] };

export type AvailabilityResult =
  | {
      available: true;
      requested_date: string;
      spoken_date: string;
      slots: Slot[];
      total_free: number;
      message: string;
    }
  | {
      available: false;
      requested_date: string | null;
      reason: "closed" | "full" | "past" | "invalid_date";
      next_days: DaySlots[];
      message: string;
    };

export type SlotCheck =
  | { ok: true; start: DateTime; end: DateTime }
  | { ok: false; reason: "invalid_format" | "closed" | "outside_hours" | "misaligned" | "too_soon" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseHm(hm: string): { hour: number; minute: number } {
  const [hour, minute] = hm.split(":").map(Number);
  return { hour, minute };
}

/** All slot starts of a local calendar day, ignoring bookings and the current time. */
export function daySlotStarts(date: DateTime, cfg: AgencyConfig): DateTime[] {
  const hours = cfg.openingHours[date.weekday];
  if (!hours) return [];
  const open = date.set({ ...parseHm(hours.open), second: 0, millisecond: 0 });
  const close = date.set({ ...parseHm(hours.close), second: 0, millisecond: 0 });
  const starts: DateTime[] = [];
  for (let t = open; t.plus({ minutes: cfg.slotMinutes }) <= close; t = t.plus({ minutes: cfg.slotMinutes })) {
    starts.push(t);
  }
  return starts;
}

function earliestBookable(now: Date, cfg: AgencyConfig): number {
  return now.getTime() + cfg.minLeadMinutes * 60_000;
}

/** Free slots of one local day: business hours minus bookings minus the past. */
export function freeSlotsForDay(date: DateTime, now: Date, booked: Set<number>, cfg: AgencyConfig): DateTime[] {
  const min = earliestBookable(now, cfg);
  return daySlotStarts(date, cfg).filter((s) => s.toMillis() >= min && !booked.has(s.toMillis()));
}

export function spokenDate(dt: DateTime): string {
  const d = dt.setLocale("fr");
  const day = d.day === 1 ? "1er" : String(d.day);
  return `${d.toFormat("cccc")} ${day} ${d.toFormat("LLLL")}`;
}

export function spokenTime(dt: DateTime): string {
  return dt.minute === 0 ? `${dt.hour} heures` : `${dt.hour} heures ${String(dt.minute).padStart(2, "0")}`;
}

export function spokenSlot(dt: DateTime): string {
  return `${spokenDate(dt)} à ${spokenTime(dt)}`;
}

function toSlot(dt: DateTime): Slot {
  return { start_iso: dt.toISO({ suppressMilliseconds: true })!, spoken: spokenSlot(dt) };
}

/**
 * Pick up to `max` slots. With a preferred time, the closest ones (kept in time order);
 * otherwise spread over the day so the caller hears both morning and afternoon options.
 */
function pickSlots(free: DateTime[], max: number, preferred?: { hour: number; minute: number }): DateTime[] {
  if (free.length <= max) return free;
  if (preferred) {
    const target = preferred.hour * 60 + preferred.minute;
    return [...free]
      .sort((a, b) => Math.abs(a.hour * 60 + a.minute - target) - Math.abs(b.hour * 60 + b.minute - target))
      .slice(0, max)
      .sort((a, b) => a.toMillis() - b.toMillis());
  }
  const step = (free.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => free[Math.round(i * step)]);
}

/** Next local days (after `from`) that still have free slots, with their first few slots. */
export function nextOpenDays(
  from: DateTime,
  now: Date,
  booked: Set<number>,
  cfg: AgencyConfig,
  count = cfg.alternativeDays,
  slotsPerDay = 3,
): DaySlots[] {
  const days: DaySlots[] = [];
  for (let i = 1; i <= cfg.searchHorizonDays && days.length < count; i++) {
    const day = from.plus({ days: i });
    const free = freeSlotsForDay(day, now, booked, cfg);
    if (free.length > 0) {
      days.push({ date: day.toISODate()!, spoken_date: spokenDate(day), slots: free.slice(0, slotsPerDay).map(toSlot) });
    }
  }
  return days;
}

function describeDays(days: DaySlots[]): string {
  if (days.length === 0) return "Aucune disponibilité trouvée dans les prochaines semaines.";
  return "Prochains jours avec des disponibilités : " + days.map((d) => d.spoken_date).join(", ") + ".";
}

export function checkAvailability(params: {
  date: string | undefined;
  preferredTime?: string;
  now: Date;
  booked: Set<number>;
  cfg: AgencyConfig;
}): AvailabilityResult {
  const { now, booked, cfg } = params;
  const today = DateTime.fromJSDate(now, { zone: cfg.timezone }).startOf("day");
  const preferred =
    params.preferredTime && /^\d{1,2}:\d{2}$/.test(params.preferredTime) ? parseHm(params.preferredTime) : undefined;

  const raw = (params.date ?? "").trim().slice(0, 10);
  const date = DATE_RE.test(raw) ? DateTime.fromISO(raw, { zone: cfg.timezone }) : null;

  if (!date || !date.isValid) {
    const next_days = nextOpenDays(today.minus({ days: 1 }), now, booked, cfg);
    return {
      available: false,
      requested_date: params.date ?? null,
      reason: "invalid_date",
      next_days,
      message: "Date non comprise, demande au client de préciser le jour. " + describeDays(next_days),
    };
  }

  const requested = date.toISODate()!;
  const searchFrom = date < today ? today.minus({ days: 1 }) : date;

  if (date < today) {
    const next_days = nextOpenDays(searchFrom, now, booked, cfg);
    return {
      available: false,
      requested_date: requested,
      reason: "past",
      next_days,
      message: `Le ${spokenDate(date)} est déjà passé. ` + describeDays(next_days),
    };
  }

  if (!cfg.openingHours[date.weekday]) {
    const next_days = nextOpenDays(searchFrom, now, booked, cfg);
    return {
      available: false,
      requested_date: requested,
      reason: "closed",
      next_days,
      message: `L'agence est fermée le ${spokenDate(date)}. ` + describeDays(next_days),
    };
  }

  const free = freeSlotsForDay(date, now, booked, cfg);
  if (free.length === 0) {
    const next_days = nextOpenDays(searchFrom, now, booked, cfg);
    return {
      available: false,
      requested_date: requested,
      reason: "full",
      next_days,
      message: `Plus aucun créneau libre le ${spokenDate(date)}. ` + describeDays(next_days),
    };
  }

  const picked = pickSlots(free, cfg.maxSlotsPerAnswer, preferred).map(toSlot);
  return {
    available: true,
    requested_date: requested,
    spoken_date: spokenDate(date),
    slots: picked,
    total_free: free.length,
    message:
      `Créneaux libres le ${spokenDate(date)} : ` +
      picked.map((s) => spokenTime(DateTime.fromISO(s.start_iso, { zone: cfg.timezone }))).join(", ") +
      (free.length > picked.length ? ` (${free.length} créneaux libres au total ce jour-là).` : "."),
  };
}

/** Is this exact instant a bookable slot start (open day, inside hours, aligned, not too soon)? */
export function checkSlot(iso: string, now: Date, cfg: AgencyConfig): SlotCheck {
  if (typeof iso !== "string" || !/T\d{2}:\d{2}/.test(iso)) return { ok: false, reason: "invalid_format" };
  const parsed = DateTime.fromISO(iso, { setZone: true });
  if (!parsed.isValid) return { ok: false, reason: "invalid_format" };
  const start = parsed.setZone(cfg.timezone);
  const hours = cfg.openingHours[start.weekday];
  if (!hours) return { ok: false, reason: "closed" };
  const valid = daySlotStarts(start.startOf("day"), cfg);
  if (!valid.some((s) => s.toMillis() === start.toMillis())) {
    const open = start.set(parseHm(hours.open));
    const lastStart = start.set(parseHm(hours.close)).minus({ minutes: cfg.slotMinutes });
    return { ok: false, reason: start < open || start > lastStart ? "outside_hours" : "misaligned" };
  }
  if (start.toMillis() < earliestBookable(now, cfg)) return { ok: false, reason: "too_soon" };
  return { ok: true, start, end: start.plus({ minutes: cfg.slotMinutes }) };
}

/** Up to `count` free slots at or after `around` (same day first, then following days). */
export function alternativeSlots(around: DateTime, now: Date, booked: Set<number>, cfg: AgencyConfig, count = 3): Slot[] {
  const out: DateTime[] = [];
  let day = around.setZone(cfg.timezone).startOf("day");
  const today = DateTime.fromJSDate(now, { zone: cfg.timezone }).startOf("day");
  if (day < today) day = today;
  for (let i = 0; i <= cfg.searchHorizonDays && out.length < count; i++, day = day.plus({ days: 1 })) {
    for (const s of freeSlotsForDay(day, now, booked, cfg)) {
      if (s.toMillis() >= around.toMillis() && out.length < count) out.push(s);
    }
  }
  return out.map(toSlot);
}

/** Deterministic advisor per slot (capacity is one meeting per slot, see the unique index). */
export function advisorFor(start: DateTime, cfg: AgencyConfig): string {
  const index = Math.floor((start.hour * 60 + start.minute) / cfg.slotMinutes);
  return cfg.advisors[index % cfg.advisors.length];
}

/** UTC range of bookings needed to answer for `date` (requested day plus the search horizon). */
export function bookingWindow(date: string | undefined, now: Date, cfg: AgencyConfig): { from: string; to: string } {
  const today = DateTime.fromJSDate(now, { zone: cfg.timezone }).startOf("day");
  const raw = (date ?? "").trim().slice(0, 10);
  const parsed = DATE_RE.test(raw) ? DateTime.fromISO(raw, { zone: cfg.timezone }) : today;
  const start = parsed.isValid && parsed > today ? parsed : today;
  return {
    from: start.toUTC().toISO()!,
    to: start.plus({ days: cfg.searchHorizonDays + 1 }).toUTC().toISO()!,
  };
}
