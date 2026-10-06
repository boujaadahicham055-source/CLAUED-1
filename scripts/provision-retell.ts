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

const llm = ids.llm_id ? await client.llm.update(ids.llm_id, llmBody) : await client.llm.create(llmBody);
console.log(`${ids.llm_id ? "Updated" : "Created"} LLM ${llm.llm_id} (model ${model})`);

const agentBody = agentParams({ cfg: agency, baseUrl, llmId: llm.llm_id, voiceId, languages });
const agent = ids.agent_id ? await client.agent.update(ids.agent_id, agentBody) : await client.agent.create(agentBody);
console.log(`${ids.agent_id ? "Updated" : "Created"} agent ${agent.agent_id} (version ${agent.version})`);

if (!values["no-publish"] && !agent.is_published) {
  await client.agent.publish(agent.agent_id, { version: agent.version });
  console.log(`Published agent version ${agent.version}`);
}

writeFileSync(IDS_FILE, JSON.stringify({ llm_id: llm.llm_id, agent_id: agent.agent_id, voice_id: voiceId, model }, null, 2) + "\n");
console.log(`Saved ids to ${IDS_FILE}. Set RETELL_AGENT_ID=${agent.agent_id} on Vercel.`);
