-- =============================================================
-- Sale-CRM-efin — Row Level Security policies
-- Confirmed RBAC model:
--   SELECT: any authenticated user (staff read-all)
--   INSERT: authenticated, created_by must equal auth.uid()
--   UPDATE: admin or record creator
--   DELETE: admin or record creator (staff cannot delete others' records)
-- profiles: read-all authenticated; role changes admin-only
-- =============================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_read_all_authenticated" on public.profiles
  for select using (auth.uid() is not null);

-- users may update their own profile; admin may update anyone
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (public.is_admin() or id = auth.uid());

-- block non-admin role changes even on own profile
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- allow backend/service-role changes (no auth.uid) and admins;
  -- block only an authenticated non-admin trying to change a role
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'only admin can change roles';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

-- ---------- business tables: same 4-policy pattern ----------

-- accounts
alter table public.accounts enable row level security;
create policy "accounts_read_all_authenticated" on public.accounts
  for select using (auth.uid() is not null);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "accounts_update_own_or_admin" on public.accounts
  for update using (public.is_admin() or created_by = auth.uid());
create policy "accounts_delete_own_or_admin" on public.accounts
  for delete using (public.is_admin() or created_by = auth.uid());

-- opportunities
alter table public.opportunities enable row level security;
create policy "opportunities_read_all_authenticated" on public.opportunities
  for select using (auth.uid() is not null);
create policy "opportunities_insert_own" on public.opportunities
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "opportunities_update_own_or_admin" on public.opportunities
  for update using (public.is_admin() or created_by = auth.uid());
create policy "opportunities_delete_own_or_admin" on public.opportunities
  for delete using (public.is_admin() or created_by = auth.uid());

-- account_contacts
alter table public.account_contacts enable row level security;
create policy "account_contacts_read_all_authenticated" on public.account_contacts
  for select using (auth.uid() is not null);
create policy "account_contacts_insert_own" on public.account_contacts
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "account_contacts_update_own_or_admin" on public.account_contacts
  for update using (public.is_admin() or created_by = auth.uid());
create policy "account_contacts_delete_own_or_admin" on public.account_contacts
  for delete using (public.is_admin() or created_by = auth.uid());

-- account_notes
alter table public.account_notes enable row level security;
create policy "account_notes_read_all_authenticated" on public.account_notes
  for select using (auth.uid() is not null);
create policy "account_notes_insert_own" on public.account_notes
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "account_notes_update_own_or_admin" on public.account_notes
  for update using (public.is_admin() or created_by = auth.uid());
create policy "account_notes_delete_own_or_admin" on public.account_notes
  for delete using (public.is_admin() or created_by = auth.uid());

-- packages
alter table public.packages enable row level security;
create policy "packages_read_all_authenticated" on public.packages
  for select using (auth.uid() is not null);
create policy "packages_insert_own" on public.packages
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "packages_update_own_or_admin" on public.packages
  for update using (public.is_admin() or created_by = auth.uid());
create policy "packages_delete_own_or_admin" on public.packages
  for delete using (public.is_admin() or created_by = auth.uid());

-- idea_packages
alter table public.idea_packages enable row level security;
create policy "idea_packages_read_all_authenticated" on public.idea_packages
  for select using (auth.uid() is not null);
create policy "idea_packages_insert_own" on public.idea_packages
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "idea_packages_update_own_or_admin" on public.idea_packages
  for update using (public.is_admin() or created_by = auth.uid());
create policy "idea_packages_delete_own_or_admin" on public.idea_packages
  for delete using (public.is_admin() or created_by = auth.uid());

-- leads
alter table public.leads enable row level security;
create policy "leads_read_all_authenticated" on public.leads
  for select using (auth.uid() is not null);
create policy "leads_insert_own" on public.leads
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "leads_update_own_or_admin" on public.leads
  for update using (public.is_admin() or created_by = auth.uid());
create policy "leads_delete_own_or_admin" on public.leads
  for delete using (public.is_admin() or created_by = auth.uid());
