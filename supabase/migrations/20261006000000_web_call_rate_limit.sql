-- Rate limit for /api/create-web-call: a shared demo link must not burn Retell credits.
-- Stores a salted hash of the caller IP, never the raw IP.

create table if not exists public.web_call_requests (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists web_call_requests_ip_time on public.web_call_requests (ip_hash, created_at desc);
create index if not exists web_call_requests_time on public.web_call_requests (created_at desc);

alter table public.web_call_requests enable row level security;
