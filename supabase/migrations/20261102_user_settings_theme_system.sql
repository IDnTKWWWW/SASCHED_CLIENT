-- ============================================================================
-- SASCHED Platform: Allow 'system' in public.user_settings.theme
-- Safe to run multiple times (idempotent)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop any existing CHECK constraint on public.user_settings referencing the theme column
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'user_settings'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%theme%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  -- Add updated CHECK constraint supporting 'light', 'dark', and 'system'
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_theme_check
      CHECK (theme IN ('light', 'dark', 'system'));
  END IF;
END $$;

