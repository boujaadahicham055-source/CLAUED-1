# PROGRESS

Project: Retell AI voice agent demo for a travel agency (fictional "Atlas Voyages", Casablanca).
Resume from: this file, `tests/checklist.json`, `git log`, `docs/retell-notes.md`.

## Checkpoint status
- [x] 0 Preflight
- [x] 1 Booking backend, no voice (migration applied to Supabase project spjunmhdszvypquuhsxz)
- [ ] 2 Deploy backend
- [ ] 3 Retell LLM and agent
- [ ] 4 Web demo page
- [ ] 5 Hardening and handover

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
