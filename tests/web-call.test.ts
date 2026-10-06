import { beforeEach, describe, expect, it, vi } from "vitest";
import { agency } from "../config/agency.js";
import type { Db } from "../lib/db.js";
import { createDemoWebCall, isSameOrigin, RATE_LIMIT } from "../lib/web-call.js";
import { createPgliteDb } from "./helpers/pglite-db.js";

let db: Db;
const createWebCall = vi.fn(async (_body: unknown) => ({
  call_id: "call_1",
  access_token: "tok_short_lived",
  expires_at: Date.now() + 60_000,
  transport: "gateway" as const,
  ice_servers: [{ urls: "stun:stun.example.org" }],
  agent_id: "agent_1",
}));
const retell = { call: { createWebCall } } as any;
const run = (ip: string) =>
  createDemoWebCall({ db, retell, agentId: "agent_1", ip, salt: "salt", now: new Date(), cfg: agency });

beforeEach(async () => {
  db = (await createPgliteDb()).db;
  createWebCall.mockClear();
});

describe("create web call", () => {
  it("returns only what the browser needs and passes agency variables and metadata", async () => {
    const r = await run("1.1.1.1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.body).sort()).toEqual(["access_token", "call_id", "expires_at", "ice_servers", "transport"]);
    const body = createWebCall.mock.calls[0][0] as any;
    expect(body.agent_id).toBe("agent_1");
    expect(body.retell_llm_dynamic_variables.agency_name).toBe("Atlas Voyages");
    expect(body.metadata.demo_session_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rate limits one IP without calling Retell", async () => {
    for (let i = 0; i < RATE_LIMIT.perIp.max; i++) expect((await run("2.2.2.2")).ok).toBe(true);
    const blocked = await run("2.2.2.2");
    expect(blocked).toMatchObject({ ok: false, status: 429 });
    expect(createWebCall).toHaveBeenCalledTimes(RATE_LIMIT.perIp.max);
    expect((await run("3.3.3.3")).ok).toBe(true);
  });

  it("applies a global cap across IPs", async () => {
    for (let i = 0; i < RATE_LIMIT.global.max; i++) await run(`10.0.0.${i}`);
    expect(await run("10.0.1.1")).toMatchObject({ ok: false, status: 429 });
  });
});

describe("origin check", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  it("accepts same origin and rejects other or missing origins", () => {
    expect(isSameOrigin(h({ origin: "https://demo.example", host: "demo.example" }), "https://demo.example/api/x")).toBe(true);
    expect(isSameOrigin(h({ origin: "https://evil.example", host: "demo.example" }), "https://demo.example/api/x")).toBe(false);
    expect(isSameOrigin(h({ host: "demo.example" }), "https://demo.example/api/x")).toBe(false);
  });
});
