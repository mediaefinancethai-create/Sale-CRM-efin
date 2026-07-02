-- Fix: allow backend/service-role (and admins) to change roles;
-- keep blocking an authenticated non-admin from changing roles (e.g. self-promotion).
-- Run this once in the Supabase SQL Editor.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'only admin can change roles';
  end if;
  return new;
end;
$$;
