import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { agency } from "../config/agency.js";
import {
  alternativeSlots,
  checkAvailability,
  checkSlot,
  daySlotStarts,
  spokenSlot,
} from "../lib/availability.js";

const TZ = agency.timezone;
const local = (iso: string) => DateTime.fromISO(iso, { zone: TZ });
const ms = (iso: string) => DateTime.fromISO(iso, { zone: TZ }).toMillis();
const NOW = new Date("2026-10-05T07:00:00Z"); // Monday 08:00 in Casablanca (UTC+1)

function avail(date: string | undefined, now = NOW, booked = new Set<number>(), preferredTime?: string) {
  return checkAvailability({ date, now, booked, cfg: agency, preferredTime });
}

describe("timezone", () => {
  it("builds 17 half-hour slots from 09:30 to 17:30 local, UTC+1 in October", () => {
    const slots = daySlotStarts(local("2026-10-06"), agency);
    expect(slots).toHaveLength(17);
    expect(slots[0].toUTC().toISO()).toBe("2026-10-06T08:30:00.000Z");
    expect(slots.at(-1)!.toUTC().toISO()).toBe("2026-10-06T16:30:00.000Z");
  });

  it("follows Morocco's Ramadan switch to UTC+0", () => {
    const slots = daySlotStarts(local("2026-03-02"), agency);
    expect(slots[0].toUTC().toISO()).toBe("2026-03-02T09:30:00.000Z");
  });

  it("uses the local day, not the UTC day, when the dates differ", () => {
    // Friday 23:30 UTC is already Saturday 00:30 in Casablanca: Saturday is a full open day.
    const sat = avail("2026-10-10", new Date("2026-10-09T23:30:00Z"));
    expect(sat.available).toBe(true);
    if (sat.available) {
      expect(sat.total_free).toBe(17);
      expect(sat.slots[0].start_iso).toBe("2026-10-10T09:30:00+01:00");
    }
    // Saturday 23:30 UTC is Sunday 00:30 local: Saturday is now in the past.
    const past = avail("2026-10-10", new Date("2026-10-10T23:30:00Z"));
    expect(past.available).toBe(false);
    if (!past.available) {
      expect(past.reason).toBe("past");
      expect(past.next_days[0].date).toBe("2026-10-12");
    }
  });

  it("accepts a slot given in UTC and converts it to local time", () => {
    const r = checkSlot("2026-10-06T08:30:00Z", NOW, agency);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.start.toFormat("HH:mm")).toBe("09:30");
  });
});

describe("closed day", () => {
  it("never offers Sunday and returns the next 3 open days", () => {
    const r = avail("2026-10-11");
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reason).toBe("closed");
      expect(r.next_days.map((d) => d.date)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
      expect(r.next_days[0].spoken_date).toBe("lundi 12 octobre");
      expect(r.next_days.every((d) => d.slots.length > 0)).toBe(true);
    }
  });

  it("rejects booking a Sunday slot", () => {
    expect(checkSlot("2026-10-11T10:00:00+01:00", NOW, agency)).toEqual({ ok: false, reason: "closed" });
  });
});

describe("full day", () => {
  it("returns the next 3 days with free slots when every slot is booked", () => {
    const booked = new Set(daySlotStarts(local("2026-10-13"), agency).map((s) => s.toMillis()));
    const r = avail("2026-10-13", NOW, booked);
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reason).toBe("full");
      expect(r.next_days.map((d) => d.date)).toEqual(["2026-10-14", "2026-10-15", "2026-10-16"]);
    }
  });

  it("skips Sunday when Saturday is over", () => {
    const r = avail("2026-10-10", new Date("2026-10-10T16:50:00Z")); // Saturday 17:50 local
    expect(r.available).toBe(false);
    if (!r.available) expect(r.next_days.map((d) => d.date)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
  });

  it("never offers a booked slot", () => {
    const booked = new Set([ms("2026-10-13T09:30"), ms("2026-10-13T17:30")]);
    const r = avail("2026-10-13", NOW, booked);
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.total_free).toBe(15);
      expect(r.slots.map((s) => s.start_iso)).not.toContain("2026-10-13T09:30:00+01:00");
    }
  });
});

describe("past and outside hours", () => {
  it("offers only slots at least 30 minutes ahead today", () => {
    const r = avail("2026-10-05", new Date("2026-10-05T09:10:00Z")); // 10:10 local
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.slots[0].start_iso).toBe("2026-10-05T11:00:00+01:00");
      expect(r.total_free).toBe(14);
    }
  });

  it("treats a past date as past", () => {
    const r = avail("2026-10-01");
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reason).toBe("past");
      expect(r.next_days[0].date).toBe("2026-10-05");
    }
  });

  it("rejects slots outside hours, misaligned or too soon", () => {
    expect(checkSlot("2026-10-06T09:00:00+01:00", NOW, agency)).toEqual({ ok: false, reason: "outside_hours" });
    expect(checkSlot("2026-10-06T18:00:00+01:00", NOW, agency)).toEqual({ ok: false, reason: "outside_hours" });
    expect(checkSlot("2026-10-06T10:15:00+01:00", NOW, agency)).toEqual({ ok: false, reason: "misaligned" });
    expect(checkSlot("2026-10-05T08:00:00+01:00", NOW, agency)).toEqual({ ok: false, reason: "outside_hours" });
    expect(checkSlot("2026-10-05T08:30:00+01:00", new Date("2026-10-05T08:00:00Z"), agency)).toEqual({
      ok: false,
      reason: "outside_hours",
    });
    expect(checkSlot("2026-10-05T09:30:00+01:00", new Date("2026-10-05T08:10:00Z"), agency)).toEqual({
      ok: false,
      reason: "too_soon",
    });
    expect(checkSlot("2026-10-06T17:30:00+01:00", NOW, agency).ok).toBe(true);
    expect(checkSlot("demain 10h", NOW, agency)).toEqual({ ok: false, reason: "invalid_format" });
  });

  it("answers an unparseable date with the next open days from today", () => {
    const r = avail("mardi prochain");
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.reason).toBe("invalid_date");
      expect(r.next_days[0].date).toBe("2026-10-05");
    }
  });
});

describe("slot choice and speech", () => {
  it("spreads 5 slots over the day by default", () => {
    const r = avail("2026-10-13");
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.slots).toHaveLength(5);
      expect(r.slots[0].spoken).toBe("mardi 13 octobre à 9 heures 30");
      expect(r.slots.at(-1)!.spoken).toBe("mardi 13 octobre à 17 heures 30");
    }
  });

  it("returns the slots closest to a preferred time, in order", () => {
    const r = avail("2026-10-13", NOW, new Set(), "15:00");
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.slots.map((s) => s.start_iso.slice(11, 16))).toEqual(["14:00", "14:30", "15:00", "15:30", "16:00"]);
    }
  });

  it("speaks dates the French way", () => {
    expect(spokenSlot(local("2026-10-01T10:00"))).toBe("jeudi 1er octobre à 10 heures");
    expect(spokenSlot(local("2026-12-15T14:30"))).toBe("mardi 15 décembre à 14 heures 30");
  });

  it("proposes the next free slots after a taken one, across days", () => {
    const booked = new Set([ms("2026-10-10T17:00")]);
    const alts = alternativeSlots(local("2026-10-10T17:00"), NOW, booked, agency);
    expect(alts.map((s) => s.start_iso)).toEqual([
      "2026-10-10T17:30:00+01:00",
      "2026-10-12T09:30:00+01:00",
      "2026-10-12T10:00:00+01:00",
    ]);
  });
});
