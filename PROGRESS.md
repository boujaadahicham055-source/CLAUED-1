# PROGRESS

Project: Retell AI voice agent demo for a travel agency (fictional "Atlas Voyages", Casablanca).
Resume from: this file, `tests/checklist.json`, `git log`, `docs/retell-notes.md`.

## Checkpoint status
- [x] 0 Preflight
- [x] 1 Booking backend, no voice (migration applied to Supabase project spjunmhdszvypquuhsxz)
- [ ] 2 Deploy backend: BLOCKED, Vercel MCP token cannot create projects (403). Code ready, `vercel.json` added.
- [ ] 3 Retell LLM and agent: code ready (prompt, provisioning, simulation), NOT run: api.retellai.com blocked + no RETELL_API_KEY
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

## Resume here (next session, after Hicham's manual steps)
1. Check `RETELL_API_KEY` is set and `curl -s -o /dev/null -w "%{http_code}" https://api.retellai.com` is not 000.
2. Confirm the Vercel deployment built: open https://atlas-voyages-demo.vercel.app (or the URL Hicham gives).
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
