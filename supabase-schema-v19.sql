-- V19: leads generated from public sales proposals.
create table if not exists public.proposal_leads (
  id text primary key,
  slug text not null,
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'public-proposal'
);

create index if not exists proposal_leads_slug_idx on public.proposal_leads(slug);
create index if not exists proposal_leads_created_at_idx on public.proposal_leads(created_at desc);

alter table public.proposal_leads enable row level security;
