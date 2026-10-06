import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { agency } from "../config/agency.js";
import { agentParams, dynamicVariables, llmParams } from "../lib/retell-config.js";

const BASE = "https://atlas-voyages-demo.vercel.app";
const prompt = readFileSync("prompts/agent-system-prompt.md", "utf8");
const llm = llmParams({ cfg: agency, baseUrl: BASE, prompt, model: "gpt-4.1" });
const tools = Object.fromEntries((llm.general_tools ?? []).map((t) => [t.name, t as any]));

describe("Retell LLM", () => {
  it("is deterministic, agent speaks first in French", () => {
    expect(llm.model_temperature).toBe(0);
    expect(llm.start_speaker).toBe("agent");
    expect(llm.begin_message).toMatch(/^Bonjour et bienvenue chez Atlas Voyages/);
  });

  it("points both custom tools at the deployed endpoints with safe retry settings", () => {
    expect(Object.keys(tools).sort()).toEqual(["book_appointment", "check_availability", "end_call"]);
    expect(tools.check_availability).toMatchObject({
      type: "custom",
      url: `${BASE}/api/check-availability`,
      speak_during_execution: true,
      speak_after_execution: true,
      max_retry: 1,
    });
    expect(tools.book_appointment).toMatchObject({
      type: "custom",
      url: `${BASE}/api/book-appointment`,
      speak_during_execution: true,
      speak_after_execution: true,
      max_retry: 0,
    });
    for (const t of [tools.check_availability, tools.book_appointment]) {
      expect(t.timeout_ms).toBeGreaterThanOrEqual(1000);
      expect(t.timeout_ms).toBeLessThanOrEqual(10_000);
      expect(t.args_at_root).toBeUndefined(); // backend reads { name, call, args }
    }
    expect(tools.book_appointment.parameters.required).toEqual(["full_name", "phone", "slot_start_iso"]);
  });

  it("only uses dynamic variables we pass or Retell system variables", () => {
    const used = new Set([...prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    const allowed = new Set([...Object.keys(dynamicVariables(agency)), "current_time", "current_calendar"]);
    for (const v of used) expect(allowed.has(v), v).toBe(true);
    expect(used.has("current_time")).toBe(true);
  });
});

describe("Retell agent", () => {
  const agent = agentParams({ cfg: agency, baseUrl: BASE, llmId: "llm_x", voiceId: "voice_x" });

  it("uses the agency timezone so {{current_time}} is Casablanca time", () => {
    expect(agent.timezone).toBe("Africa/Casablanca");
    expect(agent.language).toBe("fr-FR");
  });

  it("sends call_ended and call_analyzed to our webhook", () => {
    expect(agent.webhook_url).toBe(`${BASE}/api/retell-webhook`);
    expect(agent.webhook_events).toEqual(["call_ended", "call_analyzed"]);
  });

  it("extracts the post call fields the webhook stores", () => {
    const names = (agent.post_call_analysis_data ?? []).map((d) => d.name);
    expect(names).toEqual(["call_summary", "user_sentiment", "destination", "travel_dates", "travelers", "budget_range", "booked"]);
  });

  it("caps call length and silence to protect demo credits", () => {
    expect(agent.max_call_duration_ms).toBe(300_000);
    expect(agent.end_call_after_silence_ms).toBeGreaterThanOrEqual(10_000);
  });

  it("accepts a second locale for the Arabic test", () => {
    const multi = agentParams({ cfg: agency, baseUrl: BASE, llmId: "l", voiceId: "v", languages: ["fr-FR", "ar-SA"] });
    expect(multi.language).toEqual(["fr-FR", "ar-SA"]);
  });
});
