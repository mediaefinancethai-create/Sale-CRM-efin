-- =============================================================
-- Open edit rights on business data.
-- Any authenticated user may UPDATE/DELETE records in every business
-- section (accounts, opportunities, contacts, notes, packages, leads).
-- INSERT still records created_by = auth.uid().
-- User management (profiles / roles) stays admin-only — NOT touched here.
-- Idempotent: safe to run multiple times.
-- =============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'accounts','opportunities','account_contacts','account_notes',
    'packages','idea_packages','leads'
  ]
  loop
    -- drop the previous "own or admin" policies (and any prior re-run)
    execute format('drop policy if exists %I on public.%I', t || '_update_own_or_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own_or_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_authenticated', t);
    -- any logged-in user may edit/delete
    execute format(
      'create policy %I on public.%I for update using (auth.uid() is not null)',
      t || '_update_authenticated', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() is not null)',
      t || '_delete_authenticated', t);
  end loop;
end $$;
