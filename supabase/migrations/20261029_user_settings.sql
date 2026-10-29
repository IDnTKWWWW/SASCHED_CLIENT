-- =============================================================================
-- SASCHED Platform: User Profile & Settings Migration
-- Run this script in the Supabase SQL Editor
-- =============================================================================

-- 1. Create user_settings table (owner-isolated via RLS)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id text,
  program_section text,
  contact_number text,
  queue_display_mode text NOT NULL DEFAULT 'full_name'
    CHECK (queue_display_mode IN ('full_name', 'initials', 'ticket_only')),
  alert_threshold smallint NOT NULL DEFAULT 0
    CHECK (alert_threshold IN (0, 2, 3)), -- 0 = when called, 2 = 2nd in line, 3 = 3rd in line
  audio_chime_enabled boolean NOT NULL DEFAULT true,
  browser_notifications boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT false,
  reduce_motion boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'light'
    CHECK (theme IN ('light', 'dark')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for student owner (auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Add public_display_name column to queue_tickets for public queue privacy masking
--    (Keeps user_name intact for ADMIN_SPACE / staff views)
ALTER TABLE public.queue_tickets
  ADD COLUMN IF NOT EXISTS public_display_name text;

