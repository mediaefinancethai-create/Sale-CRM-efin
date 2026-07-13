-- =============================================================
-- STEP 2 of role revamp (run AFTER step 1 is committed).
-- Roles: admin (top) / manager (mid) / staff (bottom).
--  - existing 'staff' were the old mid-tier -> promote to 'manager'
--  - new 'staff' = lowest: sees ONLY own opportunities; admin/manager see all
-- Also adds opportunity_remarks (follow-up log per deal).
-- Idempotent.
-- =============================================================

-- migrate old mid-tier "staff" users to "manager"
update public.profiles set role = 'manager'::public.role_enum
where role::text = 'staff';

-- ---------- Opportunities visibility scoped by role ----------
-- admin/manager: all rows.  staff: only rows they created.
drop policy if exists "opportunities_read_all_authenticated" on public.opportunities;
drop policy if exists "opportunities_read_scoped" on public.opportunities;
create policy "opportunities_read_scoped" on public.opportunities
  for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role::text in ('admin', 'manager')
    )
  );

-- ---------- opportunity_remarks (follow-up log) ----------
create table if not exists public.opportunity_remarks (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  remark text not null,
  remark_date date not null default now(),
  author_name text,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_opp_remarks_opp on public.opportunity_remarks (opportunity_id);

alter table public.opportunity_remarks enable row level security;

drop policy if exists "opp_remarks_select" on public.opportunity_remarks;
drop policy if exists "opp_remarks_insert" on public.opportunity_remarks;
drop policy if exists "opp_remarks_delete" on public.opportunity_remarks;

-- can read a remark only if its parent opportunity is visible to the user
create policy "opp_remarks_select" on public.opportunity_remarks
  for select using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id
        and (
          o.created_by = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role::text in ('admin', 'manager')
          )
        )
    )
  );
create policy "opp_remarks_insert" on public.opportunity_remarks
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "opp_remarks_delete" on public.opportunity_remarks
  for delete using (auth.uid() is not null);
