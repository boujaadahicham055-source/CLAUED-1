// Creates or updates the Retell LLM and agent (idempotent). Ids live in .retell-ids.json (git ignored).
//
//   RETELL_API_KEY=... APP_BASE_URL=https://... npx tsx scripts/provision-retell.ts --voice <voice_id>
//   npx tsx scripts/provision-retell.ts --list-voices      # French voice candidates
//
// Options: --voice <id> (or RETELL_VOICE_ID), --model <id> (or RETELL_LLM_MODEL),
//          --languages fr-FR,ar-SA, --no-publish

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import Retell from "retell-sdk";
import { agency } from "../config/agency.js";
import { agentParams, DEFAULT_MODEL, llmParams, type LlmModel } from "../lib/retell-config.js";

const IDS_FILE = ".retell-ids.json";
type Ids = { llm_id?: string; agent_id?: string; voice_id?: string; model?: string };

const { values } = parseArgs({
  options: {
    voice: { type: "string" },
    model: { type: "string" },
    languages: { type: "string" },
    "list-voices": { type: "boolean", default: false },
    "no-publish": { type: "boolean", default: false },
  },
});

const client = new Retell({ apiKey: process.env.RETELL_API_KEY });

if (values["list-voices"]) {
  const voices = await client.voice.list();
  const french = voices.filter((v) => /fr|french|fran/i.test(`${v.accent ?? ""} ${v.voice_name}`));
  for (const v of french.length ? french : voices) {
    console.log([v.voice_id, v.voice_name, v.provider, v.gender, v.accent ?? "", v.preview_audio_url ?? ""].join(" | "));
  }
  process.exit(0);
}

const baseUrl = (process.env.APP_BASE_URL ?? "").replace(/\/$/, "");
if (!/^https:\/\//.test(baseUrl)) throw new Error("APP_BASE_URL must be the public https URL of the deployment");

const ids: Ids = existsSync(IDS_FILE) ? JSON.parse(readFileSync(IDS_FILE, "utf8")) : {};
const voiceId = values.voice ?? process.env.RETELL_VOICE_ID ?? ids.voice_id;
if (!voiceId) throw new Error("Pass --voice <voice_id> (see --list-voices)");
const model = (values.model ?? process.env.RETELL_LLM_MODEL ?? ids.model ?? DEFAULT_MODEL) as LlmModel;
const languages = values.languages?.split(",").map((s) => s.trim());

const prompt = readFileSync("prompts/agent-system-prompt.md", "utf8");
const llmBody = llmParams({ cfg: agency, baseUrl, prompt, model });

let llm: Retell.LlmResponse;
let agent: Retell.AgentResponse;
if (ids.llm_id && ids.agent_id) {
  // A published version is frozen (agent and its LLM): open a new draft from it, edit the draft, publish below.
  let draft = await client.agent.retrieve(ids.agent_id);
  if (draft.is_published) {
    draft = (await client.agent.createVersion(ids.agent_id, { base_version: draft.version })) as Retell.AgentResponse;
  }
  const engine = draft.response_engine as { llm_id: string; version?: number | null };
  const llmVersion = engine.version ?? undefined;
  llm = await client.llm.update(engine.llm_id, { ...llmBody, version: llmVersion });
  console.log(`Updated LLM ${llm.llm_id} version ${llm.version} (model ${model})`);
  const body = agentParams({ cfg: agency, baseUrl, llmId: llm.llm_id, voiceId, languages });
  body.response_engine = { type: "retell-llm", llm_id: llm.llm_id, version: llm.version };
  agent = await client.agent.update(ids.agent_id, { ...body, version: draft.version });
  console.log(`Updated agent ${agent.agent_id} draft version ${agent.version}`);
} else {
  llm = await client.llm.create(llmBody);
  console.log(`Created LLM ${llm.llm_id} (model ${model})`);
  agent = await client.agent.create(agentParams({ cfg: agency, baseUrl, llmId: llm.llm_id, voiceId, languages }));
  console.log(`Created agent ${agent.agent_id} (version ${agent.version})`);
}

// Save ids first, so a failure below never leads to duplicate resources on the next run.
writeFileSync(IDS_FILE, JSON.stringify({ llm_id: llm.llm_id, agent_id: agent.agent_id, voice_id: voiceId, model }, null, 2) + "\n");
console.log(`Saved ids to ${IDS_FILE}. Set RETELL_AGENT_ID=${agent.agent_id} on Vercel.`);

if (!values["no-publish"] && !agent.is_published) {
  // The publish endpoint answers with an empty body, which the SDK's JSON parser rejects: read the raw response.
  const res = await client.agent.publish(agent.agent_id, { version: agent.version }).asResponse();
  if (!res.ok) throw new Error(`publish failed: HTTP ${res.status}`);
  console.log(`Published agent version ${agent.version}`);
}
