// Retell LLM and agent definitions, built from config/agency.ts. Pure functions so the
// provisioning script stays thin and the payloads are unit tested.

import type Retell from "retell-sdk";
import type { AgencyConfig } from "../config/agency.js";

export type LlmModel = NonNullable<Retell.LlmCreateParams["model"]>;

// Chosen at Checkpoint 3 by scripts/simulate-calls.ts (see PROGRESS.md); override with RETELL_LLM_MODEL.
export const DEFAULT_MODEL: LlmModel = "gemini-3.5-flash";

export function dynamicVariables(cfg: AgencyConfig): Record<string, string> {
  return {
    agency_name: cfg.name,
    agency_city: cfg.city,
    assistant_name: cfg.assistantName,
    agency_timezone: cfg.timezone,
  };
}

export function beginMessage(cfg: AgencyConfig): string {
  return `Bonjour et bienvenue chez ${cfg.name}, je suis ${cfg.assistantName}, l'assistante de l'agence. Quel voyage avez-vous en tête ?`;
}

export function llmParams(opts: {
  cfg: AgencyConfig;
  baseUrl: string;
  prompt: string;
  model: LlmModel;
}): Retell.LlmCreateParams {
  const { cfg, baseUrl, prompt, model } = opts;
  return {
    model,
    model_temperature: 0,
    start_speaker: "agent",
    begin_message: beginMessage(cfg),
    general_prompt: prompt,
    default_dynamic_variables: dynamicVariables(cfg),
    general_tools: [
      {
        type: "custom",
        name: "check_availability",
        url: `${baseUrl}/api/check-availability`,
        method: "POST",
        description:
          "Renvoie les créneaux libres pour un rendez-vous avec un conseiller, à une date donnée. " +
          "Si le jour est fermé, complet ou passé, renvoie les prochains jours disponibles. " +
          "Seuls les créneaux renvoyés existent.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Jour souhaité au format AAAA-MM-JJ, calculé à partir du calendrier (ex: 2026-10-14).",
            },
            preferred_time: {
              type: "string",
              description:
                "Optionnel. Heure souhaitée au format HH:mm (ex: 15:00 pour 'vers quinze heures', 14:00 pour 'l'après-midi', 10:00 pour 'le matin').",
            },
          },
          required: ["date"],
        },
        speak_during_execution: true,
        execution_message_type: "static_text",
        execution_message_description: "Un instant, je vérifie les disponibilités.",
        speak_after_execution: true,
        timeout_ms: 8000,
        max_retry: 1,
      },
      {
        type: "custom",
        name: "book_appointment",
        url: `${baseUrl}/api/book-appointment`,
        method: "POST",
        description:
          "Réserve un créneau avec un conseiller. À appeler une seule fois, uniquement après avoir relu le numéro " +
          "à voix haute et obtenu un oui explicite sur le créneau, le nom et le numéro. Si le créneau vient d'être pris, " +
          "renvoie des alternatives.",
        parameters: {
          type: "object",
          properties: {
            full_name: { type: "string", description: "Nom complet du client, tel que confirmé." },
            phone: { type: "string", description: "Numéro de téléphone confirmé chiffre par chiffre, chiffres seulement (ex: 0612345678 ou +33612345678)." },
            slot_start_iso: {
              type: "string",
              description: "Valeur start_iso exacte d'un créneau renvoyé par check_availability.",
            },
            destination: { type: "string", description: "Destination ou envie de voyage." },
            travelers: { type: "integer", description: "Nombre de voyageurs." },
            notes: {
              type: "string",
              description: "Période, budget approximatif et toute précision utile pour le conseiller.",
            },
          },
          required: ["full_name", "phone", "slot_start_iso"],
        },
        speak_during_execution: true,
        execution_message_type: "static_text",
        execution_message_description: "Parfait, j'enregistre votre rendez-vous.",
        speak_after_execution: true,
        timeout_ms: 8000,
        // Booking is not idempotent: a retry could double insert or report a false conflict.
        max_retry: 0,
      },
      {
        type: "end_call",
        name: "end_call",
        description: "Termine l'appel après avoir dit au revoir, quand la personne n'a plus de question.",
      },
    ],
  };
}

export function postCallAnalysis(): NonNullable<Retell.AgentCreateParams["post_call_analysis_data"]> {
  return [
    { type: "system-presets", name: "call_summary", description: "Résumé en français de l'appel en deux ou trois phrases, pour le conseiller." },
    { type: "system-presets", name: "user_sentiment" },
    { type: "string", name: "destination", description: "Destination ou envie de voyage du client.", examples: ["Marrakech", "Dubaï", "Istanbul"] },
    { type: "string", name: "travel_dates", description: "Période de voyage mentionnée.", examples: ["mi-décembre", "vacances de printemps"] },
    { type: "number", name: "travelers", description: "Nombre de voyageurs." },
    { type: "string", name: "budget_range", description: "Budget approximatif mentionné.", examples: ["moyen", "environ 15 000 dirhams par personne"] },
    { type: "boolean", name: "booked", description: "Vrai si un rendez-vous a été confirmé par l'outil book_appointment pendant l'appel." },
  ];
}

export function agentParams(opts: {
  cfg: AgencyConfig;
  baseUrl: string;
  llmId: string;
  voiceId: string;
  languages?: string[];
}): Retell.AgentCreateParams {
  const { cfg, baseUrl, llmId, voiceId } = opts;
  const languages = (opts.languages ?? cfg.languages) as Retell.AgentCreateParams["language"] & string[];
  return {
    agent_name: `${cfg.name} - assistante vocale`,
    response_engine: { type: "retell-llm", llm_id: llmId },
    voice_id: voiceId,
    language: languages.length === 1 ? (languages[0] as Retell.AgentCreateParams["language"]) : languages,
    timezone: cfg.timezone,
    webhook_url: `${baseUrl}/api/retell-webhook`,
    webhook_events: ["call_ended", "call_analyzed"],
    post_call_analysis_data: postCallAnalysis(),
    // Demo safety: a shared link must not burn credits on long or abandoned calls.
    max_call_duration_ms: 5 * 60_000,
    end_call_after_silence_ms: 30_000,
    boosted_keywords: [cfg.name, ...cfg.advisors, "Marrakech", "Dubaï", "Istanbul"],
  };
}
