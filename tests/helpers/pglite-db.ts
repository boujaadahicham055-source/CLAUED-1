// In-process Postgres (PGlite) running the real migration, implementing the same Db
// interface as Supabase. Used by tests and scripts/local-server.ts.

import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { callLogRow, leadRow, type Db } from "../../lib/db.js";

const MIGRATIONS = join(import.meta.dirname, "../../supabase/migrations");

export async function createPgliteDb(): Promise<{ db: Db; pg: PGlite }> {
  const pg = new PGlite();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }

  async function upsert(table: string, row: Record<string, unknown>, conflict: string | null) {
    const cols = Object.keys(row);
    const values = cols.map((c) => {
      const v = row[c];
      return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
    });
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const update = cols
      .filter((c) => c !== conflict)
      .map((c) => `${c} = excluded.${c}`)
      .concat("updated_at = now()")
      .join(", ");
    const onConflict = conflict ? ` on conflict (${conflict}) do update set ${update}` : "";
    await pg.query(`insert into ${table} (${cols.join(", ")}) values (${placeholders})${onConflict}`, values);
  }

  const db: Db = {
    async bookedSlotStarts(fromIso, toIso) {
      const r = await pg.query<{ slot_start: Date }>(
        "select slot_start from appointments where status = 'booked' and slot_start >= $1 and slot_start < $2",
        [fromIso, toIso],
      );
      return r.rows.map((x) => x.slot_start.toISOString());
    },

    async insertAppointment(a) {
      try {
        const r = await pg.query<{ id: string }>(
          `insert into appointments (slot_start, slot_end, advisor, full_name, phone, destination, travelers, notes, call_id)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
          [a.slotStart, a.slotEnd, a.advisor, a.fullName, a.phone, a.destination, a.travelers, a.notes, a.callId],
        );
        return { ok: true, id: r.rows[0].id };
      } catch (err: any) {
        if (err?.code === "23505") return { ok: false, reason: "slot_taken" };
        throw err;
      }
    },

    async upsertLead(l) {
      await upsert("leads", leadRow(l), l.callId ? "call_id" : null);
    },

    async upsertCallLog(c) {
      await upsert("call_logs", callLogRow(c), "call_id");
    },
  };

  return { db, pg };
}
