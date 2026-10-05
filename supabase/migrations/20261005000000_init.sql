-- Atlas Voyages voice demo: appointments, leads, call logs.
-- Only the backend (service role) touches these tables: RLS is on with no policies,
-- so the anon/publishable key cannot read or write anything.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  advisor text not null,
  full_name text not null,
  phone text not null,
  destination text,
  travelers integer check (travelers is null or travelers between 1 and 99),
  notes text,
  call_id text,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  created_at timestamptz not null default now(),
  check (slot_end > slot_start)
);

-- Double booking is impossible by construction: one booked appointment per slot start.
-- Partial so a cancelled appointment frees its slot.
create unique index if not exists appointments_one_booking_per_slot
  on public.appointments (slot_start)
  where status = 'booked';

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  call_id text unique,
  full_name text,
  phone text,
  destination text,
  travel_dates text,
  travelers integer,
  budget_range text,
  notes text,
  booked boolean not null default false,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.call_logs (
  call_id text primary key,
  agent_id text,
  call_status text,
  start_timestamp timestamptz,
  end_timestamp timestamptz,
  duration_ms integer,
  disconnection_reason text,
  transcript text,
  call_summary text,
  user_sentiment text,
  custom_analysis jsonb,
  call_cost jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;
