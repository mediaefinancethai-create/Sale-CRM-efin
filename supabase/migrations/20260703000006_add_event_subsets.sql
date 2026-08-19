-- =============================================================
-- Add two Event subsets (revenue lines):
--   'efin Let Profit Run', 'Capital Drive Golf 2026'  (source = Event)
-- Adding enum values only (not used as literals here) — safe to run as-is.
-- =============================================================
alter type public.subset_enum add value if not exists 'efin Let Profit Run';
alter type public.subset_enum add value if not exists 'Capital Drive Golf 2026';
