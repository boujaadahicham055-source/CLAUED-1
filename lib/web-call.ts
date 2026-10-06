// Server side of the browser demo: rate limit, then create a Retell web call. The browser
// only ever receives the short lived access token, never the API key.

import { createHash, randomUUID } from "node:crypto";
import type Retell from "retell-sdk";
import type { AgencyConfig } from "../config/agency.js";
import type { Db } from "./db.js";
import { dynamicVariables } from "./retell-config.js";

export const RATE_LIMIT = {
  perIp: { max: 4, windowMinutes: 10 },
  global: { max: 40, windowMinutes: 60 },
};

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

/** Salted per day, so stored hashes cannot be joined across days or reversed by brute force on one salt. */
export function hashIp(ip: string, now: Date, salt: string): string {
  return createHash("sha256").update(`${salt}:${now.toISOString().slice(0, 10)}:${ip}`).digest("hex");
}

/** Blocks cross-site use of the endpoint from another page; same-origin fetches pass. */
export function isSameOrigin(headers: Headers, requestUrl: string): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? new URL(requestUrl).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type WebCallResult =
  | { ok: true; body: { call_id: string; access_token: string; expires_at: number; transport: string; ice_servers: unknown } }
  | { ok: false; status: 429; body: { error: "rate_limited"; message: string } };

export async function createDemoWebCall(opts: {
  db: Db;
  retell: Pick<Retell, "call">;
  agentId: string;
  ip: string;
  salt: string;
  now: Date;
  cfg: AgencyConfig;
}): Promise<WebCallResult> {
  const { db, retell, agentId, ip, salt, now, cfg } = opts;
  const since = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const counts = await db.recordWebCallRequest(
    hashIp(ip, now, salt),
    since(RATE_LIMIT.perIp.windowMinutes),
    since(RATE_LIMIT.global.windowMinutes),
  );
  if (counts.ip > RATE_LIMIT.perIp.max || counts.global > RATE_LIMIT.global.max) {
    return {
      ok: false,
      status: 429,
      body: { error: "rate_limited", message: "Trop d'appels de démonstration pour le moment. Réessayez dans quelques minutes." },
    };
  }

  const call = await retell.call.createWebCall({
    agent_id: agentId,
    metadata: { demo_session_id: randomUUID(), source: "web-demo" },
    retell_llm_dynamic_variables: dynamicVariables(cfg),
  });
  return {
    ok: true,
    body: {
      call_id: call.call_id,
      access_token: call.access_token,
      expires_at: call.expires_at,
      transport: call.transport,
      ice_servers: call.ice_servers,
    },
  };
}
