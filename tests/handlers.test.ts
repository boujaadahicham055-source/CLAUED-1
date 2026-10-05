import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { agency } from "../config/agency.js";
import type { Db } from "../lib/db.js";
import { handleBookAppointment, handleCheckAvailability, handleWebhook, normalizePhone } from "../lib/handlers.js";
import { createPgliteDb } from "./helpers/pglite-db.js";

const NOW = new Date("2026-10-05T07:00:00Z");
let db: Db;
let pg: PGlite;
const ctx = () => ({ db, now: NOW, cfg: agency });

const booking = (over: Record<string, unknown> = {}) => ({
  full_name: "Nadia El Amrani",
  phone: "06 12 34 56 78",
  slot_start_iso: "2026-10-13T10:00:00+01:00",
  destination: "Marrakech",
  travelers: 3,
  notes: "mi-décembre, budget moyen",
  ...over,
});

beforeEach(async () => {
  ({ db, pg } = await createPgliteDb());
});

describe("book_appointment", () => {
  it("books a valid slot, stores the lead and confirms out loud", async () => {
    const r = await handleBookAppointment(booking(), "call_1", ctx());
    expect(r.booked).toBe(true);
    if (r.booked) {
      expect(r.message).toBe("Rendez-vous confirmé pour Nadia El Amrani le mardi 13 octobre à 10 heures avec Yasmine Benali.");
    }
    const appt = await pg.query<any>("select phone, travelers, slot_start from appointments");
    expect(appt.rows).toHaveLength(1);
    expect(appt.rows[0].phone).toBe("0612345678");
    expect(appt.rows[0].slot_start.toISOString()).toBe("2026-10-13T09:00:00.000Z");
    const lead = await pg.query<any>("select call_id, booked, destination from leads");
    expect(lead.rows).toEqual([{ call_id: "call_1", booked: true, destination: "Marrakech" }]);
  });

  it("never double books: concurrent requests on one slot give one booking and 3 alternatives", async () => {
    const [a, b] = await Promise.all([
      handleBookAppointment(booking(), "call_a", ctx()),
      handleBookAppointment(booking({ full_name: "Omar Tazi", phone: "0700000000" }), "call_b", ctx()),
    ]);
    const results = [a, b];
    expect(results.filter((r) => r.booked)).toHaveLength(1);
    const loser = results.find((r) => !r.booked)!;
    expect(loser.booked).toBe(false);
    if (!loser.booked) {
      expect(loser.error).toBe("slot_taken");
      expect(loser.alternatives).toHaveLength(3);
      expect(loser.alternatives!.map((s) => s.start_iso)).not.toContain("2026-10-13T10:00:00+01:00");
      expect(loser.alternatives![0].start_iso).toBe("2026-10-13T10:30:00+01:00");
    }
    const count = await pg.query<any>("select count(*)::int as n from appointments");
    expect(count.rows[0].n).toBe(1);
  });

  it("removes a booked slot from availability", async () => {
    await handleBookAppointment(booking({ slot_start_iso: "2026-10-13T09:30:00+01:00" }), "call_1", ctx());
    const r = await handleCheckAvailability({ date: "2026-10-13" }, ctx());
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.total_free).toBe(16);
      expect(r.slots[0].start_iso).toBe("2026-10-13T10:00:00+01:00");
    }
  });

  it("rejects missing or invalid fields without booking", async () => {
    const r = await handleBookAppointment(booking({ phone: "12", full_name: "" }), "call_1", ctx());
    expect(r).toMatchObject({ booked: false, error: "invalid_input", missing_or_invalid: ["full_name", "phone"] });
    const count = await pg.query<any>("select count(*)::int as n from appointments");
    expect(count.rows[0].n).toBe(0);
  });

  it("refuses a Sunday slot and proposes the next open slots", async () => {
    const r = await handleBookAppointment(booking({ slot_start_iso: "2026-10-11T10:00:00+01:00" }), null, ctx());
    expect(r.booked).toBe(false);
    if (!r.booked) {
      expect(r.error).toBe("invalid_slot");
      expect(r.reason).toBe("closed");
      expect(r.alternatives![0].start_iso).toBe("2026-10-12T09:30:00+01:00");
    }
  });
});

describe("phone normalization", () => {
  it("accepts Moroccan and international formats", () => {
    expect(normalizePhone("06 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("+212 6-12-34-56-78")).toBe("+212612345678");
    expect(normalizePhone("00212612345678")).toBe("+212612345678");
    expect(normalizePhone("1234")).toBeUndefined();
  });
});

describe("webhook", () => {
  it("stores call_ended then call_analyzed without losing booking data", async () => {
    await handleBookAppointment(booking(), "call_w", ctx());
    const call = {
      call_id: "call_w",
      agent_id: "agent_x",
      call_status: "ended",
      start_timestamp: 1791000000000,
      end_timestamp: 1791000120000,
      duration_ms: 120000,
      disconnection_reason: "agent_hangup",
      transcript: "Agent: Bonjour...",
      metadata: { demo_session_id: "s1" },
    };
    await handleWebhook({ event: "call_ended", call }, db);
    await handleWebhook(
      {
        event: "call_analyzed",
        call: {
          ...call,
          call_analysis: {
            call_summary: "Projet Marrakech pour 3 personnes, rendez-vous pris.",
            user_sentiment: "Positive",
            custom_analysis_data: { destination: "Marrakech", travel_dates: "mi-décembre", travelers: 3, budget_range: "moyen", booked: false },
          },
        },
      },
      db,
    );
    const log = await pg.query<any>("select call_summary, user_sentiment, duration_ms, transcript from call_logs");
    expect(log.rows).toEqual([
      {
        call_summary: "Projet Marrakech pour 3 personnes, rendez-vous pris.",
        user_sentiment: "Positive",
        duration_ms: 120000,
        transcript: "Agent: Bonjour...",
      },
    ]);
    const lead = await pg.query<any>("select full_name, phone, booked, travel_dates, budget_range from leads");
    expect(lead.rows).toEqual([
      { full_name: "Nadia El Amrani", phone: "0612345678", booked: true, travel_dates: "mi-décembre", budget_range: "moyen" },
    ]);
  });

  it("ignores other events", async () => {
    await handleWebhook({ event: "call_started", call: { call_id: "c" } }, db);
    const n = await pg.query<any>("select count(*)::int as n from call_logs");
    expect(n.rows[0].n).toBe(0);
  });
});
