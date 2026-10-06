// Storage boundary. Production uses Supabase; tests and the local server inject a PGlite
// database that runs the same migration, so the unique-slot rule is tested for real.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type NewAppointment = {
  slotStart: string;
  slotEnd: string;
  advisor: string;
  fullName: string;
  phone: string;
  destination: string | null;
  travelers: number | null;
  notes: string | null;
  callId: string | null;
};

export type InsertResult = { ok: true; id: string } | { ok: false; reason: "slot_taken" };

/** Only defined fields are written, so a later event never blanks earlier data. */
export type LeadFields = {
  callId: string | null;
  fullName?: string;
  phone?: string;
  destination?: string;
  travelDates?: string;
  travelers?: number;
  budgetRange?: string;
  notes?: string;
  booked?: boolean;
  appointmentId?: string;
};

export type CallLogFields = {
  callId: string;
  agentId?: string;
  callStatus?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  durationMs?: number;
  disconnectionReason?: string;
  transcript?: string;
  callSummary?: string;
  userSentiment?: string;
  customAnalysis?: unknown;
  callCost?: unknown;
  metadata?: unknown;
};

export interface Db {
  /** Start instants (ISO) of booked appointments in [from, to). */
  bookedSlotStarts(fromIso: string, toIso: string): Promise<string[]>;
  insertAppointment(a: NewAppointment): Promise<InsertResult>;
  upsertLead(l: LeadFields): Promise<void>;
  upsertCallLog(c: CallLogFields): Promise<void>;
  /** Records a web call request and returns how many happened since each timestamp. */
  recordWebCallRequest(ipHash: string, ipSinceIso: string, globalSinceIso: string): Promise<{ ip: number; global: number }>;
}

const LEAD_COLUMNS: Record<Exclude<keyof LeadFields, "callId">, string> = {
  fullName: "full_name",
  phone: "phone",
  destination: "destination",
  travelDates: "travel_dates",
  travelers: "travelers",
  budgetRange: "budget_range",
  notes: "notes",
  booked: "booked",
  appointmentId: "appointment_id",
};

const CALL_LOG_COLUMNS: Record<keyof CallLogFields, string> = {
  callId: "call_id",
  agentId: "agent_id",
  callStatus: "call_status",
  startTimestamp: "start_timestamp",
  endTimestamp: "end_timestamp",
  durationMs: "duration_ms",
  disconnectionReason: "disconnection_reason",
  transcript: "transcript",
  callSummary: "call_summary",
  userSentiment: "user_sentiment",
  customAnalysis: "custom_analysis",
  callCost: "call_cost",
  metadata: "metadata",
};

/** Maps camelCase fields to column names, dropping undefined values. */
export function toRow(fields: object, columns: Record<string, string>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && columns[key]) row[columns[key]] = value;
  }
  return row;
}

export const leadRow = (l: LeadFields) => toRow(l, { ...LEAD_COLUMNS, callId: "call_id" });
export const callLogRow = (c: CallLogFields) => toRow(c, CALL_LOG_COLUMNS);

const UNIQUE_VIOLATION = "23505";

export function supabaseDb(client: SupabaseClient): Db {
  return {
    async bookedSlotStarts(fromIso, toIso) {
      const { data, error } = await client
        .from("appointments")
        .select("slot_start")
        .eq("status", "booked")
        .gte("slot_start", fromIso)
        .lt("slot_start", toIso);
      if (error) throw new Error(`bookedSlotStarts: ${error.message}`);
      return (data ?? []).map((r) => r.slot_start as string);
    },

    async insertAppointment(a) {
      const { data, error } = await client
        .from("appointments")
        .insert({
          slot_start: a.slotStart,
          slot_end: a.slotEnd,
          advisor: a.advisor,
          full_name: a.fullName,
          phone: a.phone,
          destination: a.destination,
          travelers: a.travelers,
          notes: a.notes,
          call_id: a.callId,
        })
        .select("id")
        .single();
      if (error?.code === UNIQUE_VIOLATION) return { ok: false, reason: "slot_taken" };
      if (error) throw new Error(`insertAppointment: ${error.message}`);
      return { ok: true, id: data.id as string };
    },

    async upsertLead(l) {
      const row = { ...leadRow(l), updated_at: new Date().toISOString() };
      const { error } = l.callId
        ? await client.from("leads").upsert(row, { onConflict: "call_id" })
        : await client.from("leads").insert(row);
      if (error) throw new Error(`upsertLead: ${error.message}`);
    },

    async upsertCallLog(c) {
      const row = { ...callLogRow(c), updated_at: new Date().toISOString() };
      const { error } = await client.from("call_logs").upsert(row, { onConflict: "call_id" });
      if (error) throw new Error(`upsertCallLog: ${error.message}`);
    },

    async recordWebCallRequest(ipHash, ipSinceIso, globalSinceIso) {
      const insert = await client.from("web_call_requests").insert({ ip_hash: ipHash });
      if (insert.error) throw new Error(`recordWebCallRequest: ${insert.error.message}`);
      const [ip, global] = await Promise.all([
        client
          .from("web_call_requests")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", ipSinceIso),
        client.from("web_call_requests").select("id", { count: "exact", head: true }).gte("created_at", globalSinceIso),
      ]);
      if (ip.error || global.error) throw new Error(`recordWebCallRequest: ${(ip.error ?? global.error)!.message}`);
      return { ip: ip.count ?? 0, global: global.count ?? 0 };
    },
  };
}

let override: Db | null = null;
let cached: Db | null = null;

/** Used by tests and scripts/local-server.ts. */
export function setDb(db: Db | null): void {
  override = db;
}

export function getDb(): Db {
  if (override) return override;
  if (!cached) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    cached = supabaseDb(createClient(url, key, { auth: { persistSession: false } }));
  }
  return cached;
}
