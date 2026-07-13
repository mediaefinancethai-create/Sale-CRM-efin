-- =============================================================
-- STEP 1 of role revamp — add the 'manager' enum value.
-- Adding an enum value must be COMMITTED before it can be used as a
-- literal, so this runs on its own (do not combine with step 2).
-- =============================================================
alter type public.role_enum add value if not exists 'manager';
