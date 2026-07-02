-- =============================================================
-- Sale-CRM-efin — initial schema
-- Enums, profiles + auto-provision trigger, business tables
-- =============================================================

-- ---------- Enums ----------
create type public.role_enum as enum ('admin', 'staff');
create type public.source_enum as enum ('Event', 'Media');
-- 'media' included because 4 of 11 real packages and REVENUE_PLAN use it
create type public.subset_enum as enum ('better trade', 'efinancethai', 'crypto', 'esg', 'media');
create type public.stage_enum as enum (
  'Prospecting', 'Qualified', 'Needs Analysis', 'Proposal',
  'Negotiation', 'Verbal Win', 'Closed Won', 'Closed Lost'
);

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.role_enum not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helper: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- auto-create profile on new auth user (default role: staff)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- accounts ----------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,                -- e.g. 'A-001' from prototype
  name text not null,
  symbol text,
  segment text,
  tier text,
  city text,
  status text not null default 'Active',
  owner text,                           -- AE code from prototype roster (yok, nueng, ...)
  owner_id uuid references public.profiles (id),
  notes text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_accounts_touch before update on public.accounts
  for each row execute function public.touch_updated_at();

-- ---------- opportunities ----------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,                -- e.g. 'O-001'
  deal_no int,
  account_id uuid references public.accounts (id) on delete cascade,
  account_name text,                    -- denormalized display name (per prototype)
  owner text,
  owner_id uuid references public.profiles (id),
  segment text,
  product text,
  source public.source_enum,
  subset public.subset_enum,
  stage public.stage_enum not null default 'Prospecting',
  amount numeric(14,2) not null default 0,
  probability int,
  forecast text,
  month text,
  week text,
  close_date date,
  next_action_date date,
  next_action text,
  qt_no text,
  so_no text,
  support_owner text,
  campaign_owner text,
  invoice_status text,
  invoice_no text,
  invoice_date date,
  payment_status text,
  paid_date date,
  accounting_owner text,
  accounting_note text,
  notes text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_opportunities_account on public.opportunities (account_id);
create index idx_opportunities_stage on public.opportunities (stage);
create trigger trg_opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- ---------- account_contacts ----------
create table public.account_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  line text,
  is_primary boolean not null default false,
  note text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_account_contacts_account on public.account_contacts (account_id);
create trigger trg_account_contacts_touch before update on public.account_contacts
  for each row execute function public.touch_updated_at();

-- ---------- account_notes ----------
create table public.account_notes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  owner text,
  owner_id uuid references public.profiles (id),
  note_date date not null default now(),
  type text,                            -- Call / Meeting / Line / Email
  note text,
  next_follow_up date,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_account_notes_account on public.account_notes (account_id);
create trigger trg_account_notes_touch before update on public.account_notes
  for each row execute function public.touch_updated_at();

-- ---------- packages (catalog) ----------
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  source public.source_enum,
  subset public.subset_enum,
  list_price numeric(14,2),
  components text,
  best_for text,
  angle text,
  tier text,
  owner text,
  status text not null default 'Ready',
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_packages_touch before update on public.packages
  for each row execute function public.touch_updated_at();

-- ---------- idea_packages ----------
create table public.idea_packages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  price numeric(14,2),
  components text,
  best_for text,
  owner text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_idea_packages_touch before update on public.idea_packages
  for each row execute function public.touch_updated_at();

-- ---------- leads (extended for leadScore) ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  company text not null,
  market text,                          -- segment/market label in prototype
  segment text,
  client_status text,                   -- 'New or no current purchase' | 'Old client / Not bought this year' | ...
  relationship_level text,              -- 'High' | 'Medium' | 'Low' | 'None'
  listed_active int not null default 0, -- 0/1 → ×20 points
  ipo_bond_pipeline int not null default 0, -- 0/1 → ×20 points
  profitable int not null default 0,    -- 0/1 → ×20 points
  research_source text,                 -- aka trigger text
  sale_action text,
  fit text,                             -- High / Medium / Low
  owner text,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();
