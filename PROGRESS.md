# PROGRESS

Project: Retell AI voice agent demo for a travel agency (fictional "Atlas Voyages", Casablanca).
Resume from: this file, `tests/checklist.json`, `git log`, `docs/retell-notes.md`.

## Checkpoint status
- [x] 0 Preflight (waiting for Hicham's "go" and the missing items below)
- [ ] 1 Booking backend, no voice
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
2. Supabase: new dedicated project (recommended) or a schema inside `digitalih-saas`?
3. Retell API key (via environment secret, never pasted in chat).
4. Browser SDK 3.x: live transcript needs the key in the browser on the new API; plan is the legacy
   `RetellWebClient.startCall` with our server token (decide at Checkpoint 4).
