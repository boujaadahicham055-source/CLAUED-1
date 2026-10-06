# PROGRESS

Project: Retell AI voice agent demo for a travel agency (fictional "Atlas Voyages", Casablanca).
Resume from: this file, `tests/checklist.json`, `git log`, `docs/retell-notes.md`.

## Checkpoint status
- [x] 0 Preflight
- [x] 1 Booking backend, no voice (migration applied to Supabase project spjunmhdszvypquuhsxz)
- [x] 2 Deploy backend: https://atlas-voyages-voice.vercel.app (Hicham imported the repo). Signed tests, real booking, double booking and cleanup verified.
- [~] 3 Retell LLM and agent: provisioned (llm_c4c6469fc551a664284b0e56b28f, agent_e6ccedc1f641155f147b0c8088, voice cartesia-Emma, model gemini-3.5-flash, published v5). Simulations done; live tests pending.
- [~] 4 Web demo page: built and checked locally (11/11 browser checks); live call untested until deploy + agent
- [~] 5 Hardening and handover: rate limit, call limits, README (FR), demo script done; cost per minute pending real calls

## Environment facts (Checkpoint 0)
- Node v22.22.0, npm 10.9.4, git 2.43.0. No Vercel CLI, no Supabase CLI binaries.
- Network policy: npm registry and raw.githubusercontent.com reachable. Blocked: docs.retellai.com,
  api.retellai.com, api.vercel.com, supabase.com. Retell API calls from this container are impossible until
  `api.retellai.com` (and ideally `docs.retellai.com`) are added to the environment's allowed domains.
- Vercel MCP: connected, team `DIGITALIH` (team_uXvPEf4ylIVnNg0sHikEpZoz).
- Supabase MCP: connected, projects `digitalih-saas` (active) and an inactive default project.
- Env vars in container: none of RETELL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_BASE_URL.

## Decisions
- Signature verification: `Retell.verify(rawBody, RETELL_API_KEY, header x-retell-signature)` from `retell-sdk`.
  No separate RETELL_WEBHOOK_SECRET exists, so it is not in `.env.example`.
- `{{current_time}}`: documented system variable, uses agent `timezone` → set `timezone: Africa/Casablanca` on the agent.

## Open questions for Hicham
1. Allow `api.retellai.com` and `docs.retellai.com` in the cloud environment network settings.
3. Retell API key (via environment secret, never pasted in chat).
4. Browser SDK 3.x: live transcript needs the key in the browser on the new API; plan is the legacy
   `RetellWebClient.startCall` with our server token (decide at Checkpoint 4).

## Checkpoint 1 notes
- Layout: `api/*.ts` are Vercel functions using Web `Request`/`Response` (`export async function POST`), so the raw body
  is available for signature checks. Logic lives in `lib/availability.ts` (pure) and `lib/handlers.ts`.
- Storage boundary `lib/db.ts` (`Db` interface). Production: Supabase service role. Tests and `scripts/local-server.ts`:
  PGlite (in-process Postgres) running the real migration, so the unique-slot rule is tested on real Postgres.
- Double booking: partial unique index on `appointments(slot_start) where status = 'booked'`. Mutation check done:
  removing the index makes the race test fail.
- Extra optional arg `preferred_time` ("HH:mm") on check_availability: returns the slots closest to that time.
  Needed for scenario 3 (caller changes their mind about the time); without it the agent only hears 5 spread slots.
- Slots need 30 min lead time (`minLeadMinutes` in config). Advisor is assigned deterministically per slot.
- Business errors (slot taken, invalid input) return HTTP 200 with a payload the LLM reads; only bad signatures
  get 401 and server faults 500.
- Supabase: Hicham approved restoring the paused project `spjunmhdszvypquuhsxz` (eu-west-2) and applying the migration
  (migration name `atlas_voyages_init`). The project already held the schema of another app (actors/writers tables,
  0 rows each); our 3 tables are additive, no name collisions. Security advisors: only INFO "RLS enabled, no policy"
  on our tables (intended). Pre-existing warnings belong to the other app's functions and were left untouched.

## Checkpoints 2 to 5 notes (session of 2026-10-06, Hicham said "go, don't ask until done")
- Production chosen over preview (stable URL for the prospect).
- Vercel MCP: `create_project` and `create_deployment` both return 403 "no permission to create a project";
  team DIGITALIH lists 0 projects. The MCP token is read-only for this team. Integrations list also 403.
- Supabase MCP only exposes publishable keys, never the service role key. Did not work around it (no anon RLS
  policies, no SECURITY DEFINER RPC): the service role key must be set on Vercel by Hicham.
- Second migration applied: `atlas_voyages_web_call_rate_limit` (table web_call_requests, RLS on, IP stored as daily salted hash).
- `vercel.json`: framework none, `npm ci --omit=dev` (keeps TypeScript 7 devDependency out of the @vercel/node build),
  static output `public/`, functions in `lhr1` (London, next to Supabase eu-west-2), maxDuration 10 s.
  RISK to check on first deploy: @vercel/node resolving `../lib/x.js` imports to `.ts` files with `"type": "module"`.
- Web SDK: page uses legacy `RetellWebClient.startCall({ accessToken, callId, transport, iceServers })` with the
  server-created token, bundled locally (`npm run build:web` → public/vendor/retell-client.js, 580 KB, loaded after paint).
  Mic is requested BEFORE asking for a token, so a refused mic never creates a billed call.
  UNVERIFIED: whether the gateway transport emits `update` (live transcript) and talking events. If not, the page
  still works (states connecting/listening/ended) without live transcript; fallback would be polling our own endpoint.
- Fonts self-hosted (Gloock + Figtree, OFL) because Google Fonts is blocked here and a demo should not depend on it.
- Agent defaults: model `gpt-4.1` (DEFAULT_MODEL in lib/retell-config.ts) until scripts/simulate-calls.ts compares models;
  max call 5 min, end after 30 s silence, timezone Africa/Casablanca, webhook events call_ended + call_analyzed.
- UNVERIFIED Retell behaviour: whether create-web-call uses the latest draft or the published agent version; the
  provisioning script publishes after each update to be safe.

## Vercel project (created by Hicham)
- Project `atlas-voyages-voice` (prj_mhEzXVRiUqK6ZTXF09rXqHBF1AEu), team DIGITALIH, production URL https://atlas-voyages-voice.vercel.app
  (not atlas-voyages-demo). Git-connected to this repo; production branch set to `claude/charming-pascal-t6x26u`.

## Resume here (next session, after Hicham's manual steps)
1. Check `RETELL_API_KEY` is set and `curl -s -o /dev/null -w "%{http_code}" https://api.retellai.com` is not 000.
2. Confirm the Vercel deployment built: open https://atlas-voyages-voice.vercel.app.
   Then re-run signed tests against it:
   `npx tsx scripts/send-signed.ts $APP_BASE_URL/api/check-availability '{"name":"check_availability","call":{"call_id":"deploy_test"},"args":{"date":"<a weekday>"}}'`
   plus `--unsigned` (expect 401), then one booking, check the row in Supabase, then delete the test rows
   (`delete from leads where call_id like 'deploy_test%'; delete from appointments where call_id like 'deploy_test%';`).
3. `npx tsx scripts/provision-retell.ts --list-voices`, present 3 French voices to Hicham, then provision with `--voice`.
4. Set `RETELL_AGENT_ID` on Vercel, redeploy.
5. `npx tsx scripts/simulate-calls.ts --models gpt-4.1,gemini-3.5-flash` → record pass rates; compare latency on live calls; record choice here.
6. Try `--languages fr-FR,ar-SA` on a live call with an Arabic speaker; report honestly.
7. `npx tsx scripts/check-page.ts $APP_BASE_URL --secret "$RETELL_API_KEY"` against production.
8. Hicham runs the 5 live scenarios; record in tests/checklist.json; fill cost per minute in README.

## Checkpoint 2 and 3 evidence (2026-10-06)
- Node scripts need `NODE_USE_ENV_PROXY=1` in this container (Node fetch ignores HTTPS_PROXY otherwise and the proxy answers 403).
- Production deploy from `claude/charming-pascal-t6x26u` built fine: the `.js` → `.ts` import worry did not happen.
- Against production: unsigned 401, wrong-key signature 401, signed check_availability 200, booking 200 (row in Supabase,
  14:30Z = 15:30 local, lead linked), same slot from a second call_id → slot_taken + 3 alternatives, no second row.
  Test rows deleted (1 lead, 1 appointment).
- `/api/create-web-call` answers 503 not_configured until Hicham adds RETELL_AGENT_ID on Vercel (MCP cannot write
  env vars on this project: 404 project not found for the MCP token).
- Retell versioning (verified): publishing an agent freezes that agent version AND its LLM version ("Cannot update
  published LLM"). Updates go through `agent.createVersion({ base_version })` → edit the draft LLM version and agent
  version → publish. `agent.publish` returns an empty body: read it with `.asResponse()`. Script fixed accordingly
  and re-run: version 1 published.
- French voices offered by Retell: cartesia-Emma (chosen by default), cartesia-Hailey-French, minimax-Camille
  (female); cartesia-Pierre, minimax-Louis (male).

## Model choice (Checkpoint 3)
Simulated with Retell's test API (scripts/simulate-calls.ts, 6 scenarios, tools mocked by our real availability logic,
LLM-judged metrics). Each model ran on a temporary draft version, deleted afterwards.
| Run | gpt-4.1 | gemini-3.5-flash |
|---|---|---|
| 1 (initial prompt) | 5/6, 74 s. FAIL happy path: booked BEFORE reading the phone back | 5/6, 57 s. FAIL change-time: offered 15:30 from earlier results instead of re-checking |
| 2 (read-back made a hard gate in prompt + tool description) | 5/6, 84 s. FAIL change-time: booked 15:30 without re-checking | 6/6, 56 s |
Choice: gemini-3.5-flash (11/12 over both runs vs 10/12, and about 30 % faster per batch, a rough proxy for turn latency).
To confirm on live calls: perceived latency and French quality. Revert with `--model gpt-4.1`.
The change-time metric is the flaky one on both models; neither model invented a time (both used real returned slots).
- Production browser check from this container is not possible: Chromium here has an empty NSS store and rejects
  the real Google Trust Services chain (curl verifies it fine). Same files were checked locally (11/11). Token
  endpoint verified on production with curl: 200, only call_id/access_token/expires_at/transport/ice_servers, no key.
