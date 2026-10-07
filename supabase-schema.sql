-- Web Factory: production storage for public demos.
create table if not exists public.demos (
  slug text primary key,
  created_at timestamptz not null default now(),
  business jsonb not null,
  design jsonb not null
);

alter table public.demos enable row level security;

-- No public policies are created on purpose.
-- The app reads/writes with SUPABASE_SERVICE_ROLE_KEY on the server only.
