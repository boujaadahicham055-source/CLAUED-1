// Calls the real Vercel handlers with requests shaped exactly like Retell's
// custom function calls ({ name, call, args }) and webhooks, signed or not.

import { createHmac } from "node:crypto";
import { DateTime } from "luxon";
import Retell from "retell-sdk";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as bookAppointment } from "../api/book-appointment.js";
import { POST as checkAvailability } from "../api/check-availability.js";
import { POST as retellWebhook } from "../api/retell-webhook.js";
import { agency } from "../config/agency.js";
import { setDb } from "../lib/db.js";
import { createPgliteDb } from "./helpers/pglite-db.js";

const KEY = "key_test_only_not_a_real_key";

// A future open weekday, so the endpoints (which use the real clock) accept it.
let day = DateTime.now().setZone(agency.timezone).plus({ days: 14 }).startOf("day");
if (day.weekday === 7) day = day.plus({ days: 1 });
const DATE = day.toISODate()!;
const SLOT = day.set({ hour: 11, minute: 0 }).toISO({ suppressMilliseconds: true })!;

const call = { call_id: "call_endpoint_test", agent_id: "agent_test", call_type: "web_call", call_status: "ongoing" };

function request(body: unknown, signature?: string | null): Request {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "content-type": "application/json", ...(signature ? { "x-retell-signature": signature } : {}) },
    body: raw,
  });
}

async function signed(body: unknown): Promise<Request> {
  return request(body, await Retell.sign(JSON.stringify(body), KEY));
}

beforeAll(async () => {
  process.env.RETELL_API_KEY = KEY;
  setDb((await createPgliteDb()).db);
});

describe("signature", () => {
  const body = { name: "check_availability", call, args: { date: DATE } };

  it("rejects an unsigned request with 401", async () => {
    const res = await checkAvailability(request(body));
    expect(res.status).toBe(401);
  });

  it("rejects a signature made with another key", async () => {
    const res = await checkAvailability(request(body, await Retell.sign(JSON.stringify(body), "other_key")));
    expect(res.status).toBe(401);
  });

  it("rejects a body changed after signing", async () => {
    const sig = await Retell.sign(JSON.stringify(body), KEY);
    const res = await checkAvailability(request({ ...body, args: { date: "2030-01-01" } }, sig));
    expect(res.status).toBe(401);
  });

  it("rejects a signature older than 5 minutes (replay)", async () => {
    const ts = Date.now() - 10 * 60_000;
    const digest = createHmac("sha256", KEY).update(JSON.stringify(body) + ts).digest("hex");
    const res = await checkAvailability(request(body, `v=${ts},d=${digest}`));
    expect(res.status).toBe(401);
  });

  it("rejects every endpoint when unsigned", async () => {
    expect((await bookAppointment(request({ name: "book_appointment", call, args: {} }))).status).toBe(401);
    expect((await retellWebhook(request({ event: "call_ended", call }))).status).toBe(401);
  });
});

describe("signed Retell requests", () => {
  it("check_availability returns speakable slots", async () => {
    const res = await checkAvailability(await signed({ name: "check_availability", call, args: { date: DATE } }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.available).toBe(true);
    expect(json.slots.length).toBeGreaterThan(0);
    expect(json.slots[0].spoken).toMatch(/ à \d+ heures/);
  });

  it("book_appointment books once, then returns alternatives for the same slot", async () => {
    const args = { full_name: "Test Client", phone: "0612345678", slot_start_iso: SLOT, destination: "Dubai", travelers: 2 };
    const first = await (await bookAppointment(await signed({ name: "book_appointment", call, args }))).json();
    expect(first.booked).toBe(true);
    const second = await (
      await bookAppointment(await signed({ name: "book_appointment", call: { ...call, call_id: "call_2" }, args }))
    ).json();
    expect(second).toMatchObject({ booked: false, error: "slot_taken" });
    expect(second.alternatives).toHaveLength(3);
  });

  it("webhook acknowledges with 204", async () => {
    const res = await retellWebhook(await signed({ event: "call_ended", call: { ...call, call_status: "ended" } }));
    expect(res.status).toBe(204);
  });
});
