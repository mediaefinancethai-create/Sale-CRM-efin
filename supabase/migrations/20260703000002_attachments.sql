-- =============================================================
-- File attachments — private Storage bucket + tracking table.
-- Open-edit model: any authenticated user may upload/read/delete.
-- Idempotent: safe to run multiple times.
-- =============================================================

-- ---------- tracking table ----------
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  size bigint,
  uploaded_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists idx_attachments_account on public.attachments (account_id);

alter table public.attachments enable row level security;

drop policy if exists "attachments_read_all_authenticated" on public.attachments;
drop policy if exists "attachments_insert_authenticated" on public.attachments;
drop policy if exists "attachments_delete_authenticated" on public.attachments;

create policy "attachments_read_all_authenticated" on public.attachments
  for select using (auth.uid() is not null);
create policy "attachments_insert_authenticated" on public.attachments
  for insert with check (auth.uid() is not null and uploaded_by = auth.uid());
create policy "attachments_delete_authenticated" on public.attachments
  for delete using (auth.uid() is not null);

-- ---------- storage bucket (private) ----------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- storage object policies scoped to the 'attachments' bucket
drop policy if exists "attachments_obj_select" on storage.objects;
drop policy if exists "attachments_obj_insert" on storage.objects;
drop policy if exists "attachments_obj_update" on storage.objects;
drop policy if exists "attachments_obj_delete" on storage.objects;

create policy "attachments_obj_select" on storage.objects
  for select using (bucket_id = 'attachments' and auth.uid() is not null);
create policy "attachments_obj_insert" on storage.objects
  for insert with check (bucket_id = 'attachments' and auth.uid() is not null);
create policy "attachments_obj_update" on storage.objects
  for update using (bucket_id = 'attachments' and auth.uid() is not null);
create policy "attachments_obj_delete" on storage.objects
  for delete using (bucket_id = 'attachments' and auth.uid() is not null);
