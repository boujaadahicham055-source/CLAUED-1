// Runs the test scenarios as simulated text conversations through Retell's test API
// (no telephony, no database writes: both tools are mocked with outputs computed by
// our real availability logic). Optionally compares several LLM models.
//
//   RETELL_API_KEY=... npx tsx scripts/simulate-calls.ts [--models gpt-4.1,gemini-3.5-flash]
//
// Needs .retell-ids.json from scripts/provision-retell.ts. With --models, the LLM model is
// switched for each run and restored to the original model at the end.

import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { DateTime } from "luxon";
import Retell from "retell-sdk";
import { agency } from "../config/agency.js";
import { checkAvailability, spokenDate } from "../lib/availability.js";
import { dynamicVariables, type LlmModel } from "../lib/retell-config.js";

const { values } = parseArgs({ options: { models: { type: "string" } } });
const client = new Retell({ apiKey: process.env.RETELL_API_KEY });
const ids = JSON.parse(readFileSync(".retell-ids.json", "utf8")) as { llm_id: string; model: string };

const now = new Date();
const today = DateTime.fromJSDate(now, { zone: agency.timezone }).startOf("day");
const nextWeekday = (weekday: number, minDays: number) => {
  let d = today.plus({ days: minDays });
  while (d.weekday !== weekday) d = d.plus({ days: 1 });
  return d;
};
const tuesday = nextWeekday(2, 7);
const sunday = nextWeekday(7, 3);
const thursday = nextWeekday(4, 7);

const availability = (d: DateTime, preferredTime?: string) =>
  JSON.stringify(checkAvailability({ date: d.toISODate()!, preferredTime, now, booked: new Set(), cfg: agency }));
const firstSlot = (d: DateTime) => JSON.parse(availability(d)).slots[0].start_iso as string;

const mocks = [
  { tool_name: "check_availability", input_match_rule: { type: "partial_match" as const, args: { date: tuesday.toISODate() } }, output: availability(tuesday) },
  { tool_name: "check_availability", input_match_rule: { type: "partial_match" as const, args: { date: sunday.toISODate() } }, output: availability(sunday) },
  { tool_name: "check_availability", input_match_rule: { type: "partial_match" as const, args: { date: thursday.toISODate(), preferred_time: "15:00" } }, output: availability(thursday, "15:00") },
  { tool_name: "check_availability", input_match_rule: { type: "partial_match" as const, args: { date: thursday.toISODate() } }, output: availability(thursday) },
  {
    tool_name: "book_appointment",
    input_match_rule: { type: "partial_match" as const, args: { slot_start_iso: firstSlot(thursday) } },
    output: JSON.stringify({
      booked: false,
      error: "slot_taken",
      alternatives: JSON.parse(availability(thursday)).slots.slice(1, 4),
      message: "Ce créneau vient d'être pris. Propose les alternatives.",
    }),
  },
  {
    tool_name: "book_appointment",
    input_match_rule: { type: "any" as const },
    output: JSON.stringify({ booked: true, advisor: "Yasmine Benali", message: "Rendez-vous confirmé avec Yasmine Benali." }),
  },
];

const scenarios = [
  {
    name: "1-happy-path",
    user_prompt: `Tu appelles une agence de voyages. Tu veux aller à Marrakech à trois personnes vers la mi-décembre, budget moyen. Pour le rendez-vous tu proposes le ${spokenDate(tuesday)} et tu acceptes le premier créneau proposé. Tu t'appelles Nadia El Amrani, ton numéro est 06 12 34 56 78. Réponds brièvement.`,
    metrics: [
      "L'agent demande destination, période, nombre de voyageurs et budget sans redemander une information déjà donnée.",
      "L'agent relit le numéro de téléphone et attend la confirmation avant de réserver.",
      "L'agent appelle book_appointment une seule fois, confirme le rendez-vous avec le nom du conseiller, puis termine l'appel.",
    ],
  },
  {
    name: "2-sunday",
    user_prompt: `Tu appelles une agence de voyages pour un voyage à Istanbul à deux. Tu demandes un rendez-vous le ${spokenDate(sunday)}. Quand on te dit que c'est fermé, tu acceptes le premier jour proposé et le premier créneau. Tu t'appelles Karim Alaoui, numéro 06 61 22 33 44.`,
    metrics: [
      "L'agent indique que l'agence est fermée ce jour-là et propose le prochain jour ouvert renvoyé par l'outil.",
      "L'agent ne propose aucun créneau un dimanche.",
    ],
  },
  {
    name: "3-change-time",
    user_prompt: `Tu appelles une agence pour un voyage à Paris en famille, quatre personnes, en avril. Tu demandes un rendez-vous le ${spokenDate(thursday)}. Après avoir entendu les créneaux, tu changes d'avis et demandes plutôt vers quinze heures, puis tu acceptes le créneau de quinze heures. Tu t'appelles Sara Bennani, numéro 07 70 11 22 33.`,
    metrics: [
      "Quand le client change d'avis, l'agent revérifie les disponibilités au lieu d'inventer un horaire.",
      "Le créneau réservé est celui choisi après le changement d'avis.",
    ],
  },
  {
    name: "4-price-dubai",
    user_prompt: `Tu appelles une agence et tu insistes pour connaître le prix exact d'un séjour d'une semaine à Dubaï pour deux personnes. Après deux refus polis, tu acceptes un rendez-vous le ${spokenDate(tuesday)} au premier créneau. Tu t'appelles Youssef Haddad, numéro 06 00 11 22 33.`,
    metrics: [
      "L'agent ne donne aucun prix, aucune estimation chiffrée et aucune promotion.",
      "L'agent réserve quand même un rendez-vous.",
    ],
  },
  {
    name: "5-phone-fix",
    user_prompt: `Tu appelles une agence pour un voyage à Agadir à deux en janvier. Tu demandes un rendez-vous le ${spokenDate(tuesday)} et acceptes le premier créneau. Tu donnes ton numéro avec une erreur : 06 12 34 56 7. Quand l'agent le relit, tu corriges : c'est 06 12 34 56 79. Tu t'appelles Leila Chraibi.`,
    metrics: [
      "L'agent relit le numéro, accepte la correction et relit le numéro corrigé avant de réserver.",
      "book_appointment est appelé avec le numéro 0612345679.",
    ],
  },
  {
    name: "6-slot-taken",
    user_prompt: `Tu appelles une agence pour un voyage à Rome à deux. Tu demandes un rendez-vous le ${spokenDate(thursday)} et tu choisis le premier créneau proposé. Si on te dit qu'il vient d'être pris, tu acceptes la première alternative. Tu t'appelles Hamza Idrissi, numéro 06 98 76 54 32.`,
    metrics: [
      "Quand la réservation échoue parce que le créneau est pris, l'agent s'excuse et propose les alternatives renvoyées.",
      "L'agent ne confirme le rendez-vous qu'après une réponse booked true.",
    ],
  },
];

async function runBatch(label: string) {
  const definitionIds: string[] = [];
  for (const s of scenarios) {
    const def = await client.tests.createTestCaseDefinition({
      name: `atlas-${label}-${s.name}`,
      response_engine: { type: "retell-llm", llm_id: ids.llm_id },
      user_prompt: s.user_prompt,
      metrics: s.metrics,
      dynamic_variables: dynamicVariables(agency),
      tool_mocks: mocks,
    });
    definitionIds.push(def.test_case_definition_id);
  }
  const started = Date.now();
  let batch = await client.tests.createBatchTest({
    response_engine: { type: "retell-llm", llm_id: ids.llm_id },
    test_case_definition_ids: definitionIds,
  });
  while (batch.status !== "complete") {
    await sleep(5000);
    batch = await client.tests.getBatchTest(batch.test_case_batch_job_id);
  }
  const runs = await client.tests.listTestRuns(batch.test_case_batch_job_id);
  console.log(`\n== ${label}: ${batch.pass_count}/${batch.total_count} passed, ${batch.fail_count} failed, ${batch.error_count} errors (${Math.round((Date.now() - started) / 1000)}s)`);
  for (const r of runs.items) {
    console.log(`- ${r.test_case_definition_snapshot?.name}: ${r.status}${r.result_explanation ? ` (${r.result_explanation})` : ""}`);
  }
  for (const id of definitionIds) await client.tests.deleteTestCaseDefinition(id);
  return batch;
}

const models = values.models?.split(",").map((m) => m.trim() as LlmModel);
if (!models) {
  await runBatch(ids.model);
} else {
  try {
    for (const model of models) {
      await client.llm.update(ids.llm_id, { model });
      await runBatch(model);
    }
  } finally {
    await client.llm.update(ids.llm_id, { model: ids.model as LlmModel });
    console.log(`\nRestored LLM model to ${ids.model}`);
  }
}
