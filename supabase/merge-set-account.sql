-- =============================================================
-- Merge duplicate SET accounts into one.
-- Keep A-015 "ตลาดหลักทรัพย์แห่งประเทศไทย" and fold A-039, A-052 into it,
-- re-linking all deals / contacts / notes / attachments first.
-- Run once in the Supabase SQL Editor (both production and dev).
-- Safe to re-run (losers already merged -> no-op).
-- =============================================================
do $$
declare
  survivor uuid;
  losers uuid[];
begin
  select id into survivor from public.accounts where legacy_id = 'A-015';
  if survivor is null then
    raise exception 'survivor account A-015 not found';
  end if;

  select array_agg(id) into losers
  from public.accounts
  where legacy_id in ('A-039', 'A-052') and id <> survivor;

  if losers is not null then
    -- re-point every child BEFORE deleting the accounts (accounts cascade-delete children)
    update public.opportunities   set account_id = survivor where account_id = any(losers);
    update public.account_contacts set account_id = survivor where account_id = any(losers);
    update public.account_notes    set account_id = survivor where account_id = any(losers);
    update public.attachments      set account_id = survivor where account_id = any(losers);
    -- opportunity_remarks / opportunity_members link via opportunity_id -> follow automatically
    delete from public.accounts where id = any(losers);
  end if;

  -- unify the displayed name everywhere
  update public.accounts set name = 'ตลาดหลักทรัพย์แห่งประเทศไทย' where id = survivor;
  update public.opportunities set account_name = 'ตลาดหลักทรัพย์แห่งประเทศไทย' where account_id = survivor;
end $$;
