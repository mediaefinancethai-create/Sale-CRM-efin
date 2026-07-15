-- =============================================================
-- opportunity_members — tag related people (profiles) on a deal.
-- Idempotent.
-- =============================================================
create table if not exists public.opportunity_members (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (opportunity_id, profile_id)
);
create index if not exists idx_opp_members_opp on public.opportunity_members (opportunity_id);

alter table public.opportunity_members enable row level security;

drop policy if exists "opp_members_select" on public.opportunity_members;
drop policy if exists "opp_members_insert" on public.opportunity_members;
drop policy if exists "opp_members_delete" on public.opportunity_members;

create policy "opp_members_select" on public.opportunity_members
  for select using (auth.uid() is not null);
create policy "opp_members_insert" on public.opportunity_members
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "opp_members_delete" on public.opportunity_members
  for delete using (auth.uid() is not null);
