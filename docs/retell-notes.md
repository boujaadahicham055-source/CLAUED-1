# Retell notes (only what this project uses)

Sources, read on 2026-10-05:
- `retell-sdk@6.1.1` (npm, published types and `src/`), the server SDK.
- `retell-client-js-sdk@3.0.2` (npm, README and types), the browser SDK.
- `RetellAI/retell-custom-llm-node-demo` on GitHub (signature header usage).
- docs.retellai.com pages via search snippets only: the container's network
  policy blocks `docs.retellai.com` and `api.retellai.com` (see PROGRESS.md).
  Anything marked **(unverified)** must be re-checked once the docs are reachable.

## Auth and signature
- REST base `https://api.retellai.com`, header `Authorization: Bearer $RETELL_API_KEY`.
- Tool calls and webhooks carry header `x-retell-signature`, format `v=<ms timestamp>,d=<hex hmac-sha256>`.
- Verify with the SDK helper: `import Retell from "retell-sdk"; await Retell.verify(rawBody, RETELL_API_KEY, signature)`
  (also exported as `verify` from `retell-sdk`). Must be the **raw** body string, not re-stringified JSON.
  Helper rejects timestamps older than 5 minutes. Secret = the API key itself (no separate webhook secret).
- `Retell.sign(body, apiKey)` exists in the same SDK: we use it in tests to build valid signatures.

## Retell LLM (`client.llm.create / update`, response engine `retell-llm`)
Fields we use: `general_prompt`, `begin_message`, `start_speaker: 'agent'`, `model`, `model_temperature` (0..1),
`general_tools`, `default_dynamic_variables`.
Model ids available in SDK 6.1.1 include `gpt-4.1`, `gpt-4.1-mini`, `gpt-5.4-mini`, `gpt-5.6-terra` (default),
`gpt-6-luna`, `claude-4.5-haiku`, `claude-5.5-sonnet`, `gemini-3.5-flash`, `gemini-3.6-flash`, ... (full union in `src/resources/llm.ts`).
Optional `model_high_priority` (lower latency, higher cost) and `tool_call_strict_mode`.

### Custom tool (`type: 'custom'`)
`name`, `url`, `description`, `parameters` (JSON Schema object), `method` (default POST),
`speak_during_execution`, `execution_message_description`, `execution_message_type: 'prompt' | 'static_text'`,
`speak_after_execution`, `timeout_ms` (1000..600000, default 120000), `max_retry` (0..5, default 0; only >0 if idempotent),
`args_at_root` (default false), `headers`, `response_variables`.
- Request body (args_at_root false): `{ name, call, args }`. `call` includes the transcript so far and call metadata.
- Response: any JSON, conventionally `{ "result": ... }`; the LLM reads it.

### End call tool
`{ type: 'end_call', name: 'end_call', description }`.

## Agent (`client.agent.create / update`)
`response_engine: { type: 'retell-llm', llm_id }`, `voice_id`, `agent_name`, `language` (single locale or array,
e.g. `['fr-FR','ar-SA']`; Darija is not in the list), `timezone` (IANA, default America/Los_Angeles),
`webhook_url`, `webhook_events` (`call_started | call_ended | call_analyzed | ...`),
`post_call_analysis_data` (items `{type:'string'|'boolean'|'enum'|'number', name, description}` or
system presets `{type:'system-presets', name:'call_summary'|'call_successful'|'user_sentiment'}`),
`max_call_duration_ms` (60000..7200000), `end_call_after_silence_ms` (min 10000), `boosted_keywords`,
`stt_mode: 'fast'|'accurate'`, `denoising_mode`.

## Dynamic variables
- Passed per call as `retell_llm_dynamic_variables: { key: "string" }` on create-web-call; defaults via LLM `default_dynamic_variables`.
- System variables (from docs search snippet): `{{current_time}}` in `{{system_timezone}}`, which defaults to the
  agent `timezone`; also `{{current_time_[IANA]}}`, `{{current_calendar}}` (14 day calendar). So: set agent
  `timezone: 'Africa/Casablanca'` and use `{{current_time}}` + `{{current_calendar}}` in the prompt.

## Web call
- `POST /v3/create-web-call` (`client.call.createWebCall`): body `agent_id`, `metadata`, `retell_llm_dynamic_variables`,
  `agent_override`, `agent_version`.
- Response: `call_id`, `access_token`, `expires_at` (epoch ms), `ice_servers[] {urls, username?, credential?}`, `transport: 'gateway'`.

## Browser SDK `retell-client-js-sdk@3.0.2` (changed vs older docs)
- New API: `new RetellClient({ key: 'public_key_...' }).createWebCall({ agent_id, hooks })`. The browser calls
  `/v3/create-web-call` itself with a **public key** scoped to allowed domains, or through a `fetch` proxy to our server.
- Live transcript on the new API needs `transcript: true`, which opens a WebSocket that **carries the key itself**
  (README: "a page that renders the transcript needs the key in the browser"). Not compatible with "API key stays server side".
- Legacy `RetellWebClient` still ships (deprecated, removed in 4.0):
  `startCall({ accessToken, transport: 'gateway', callId, iceServers })` accepts exactly the server-created response;
  emits `call_started`, `call_ready`, `call_ended`, `agent_start_talking`, `agent_stop_talking`, `update` (transcript), `error`.
  **(unverified)** whether the gateway transport delivers `update` / talking events; the README hints new calls do not.
  Decision deferred to Checkpoint 4 live test.

## Testing without phone cost
- `client.tests.createTestCaseDefinition({ name, response_engine, user_prompt, metrics, dynamic_variables, tool_mocks, llm_model })`
  and `client.tests.createBatchTest(...)` run simulated text conversations against a Retell LLM. Use for `scripts/simulate-calls.ts`.
- Voices: `client.voice.list()` → `{ voice_id, voice_name, provider, gender, accent?, preview_audio_url? }`.
