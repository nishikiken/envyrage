-- ==============================================================================
-- Supabase Migration: VIP System & Player History Persistence
-- ==============================================================================
-- This migration adds columns for:
-- 1. Weekly deposit tracking and VIP tier status (resets weekly, never downgraded by spending)
-- 2. Full persistence of user inventory history, games history, and battles history
-- ==============================================================================

-- 1. Add VIP tracking columns to users table
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS deposits_amount NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS vip_week_start TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS inventory_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS games_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS battles_history JSONB DEFAULT '[]'::jsonb;

-- 2. Create indices for fast query lookups
CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON public.users(vip_tier);
CREATE INDEX IF NOT EXISTS idx_users_vip_week_start ON public.users(vip_week_start);

-- 3. (Optional) Automated server-side function to reset weekly VIP for accounts older than 7 days
-- Note: Client-side local-backend also handles weekly reset deterministically without displaying any timer.
CREATE OR REPLACE FUNCTION public.reset_weekly_vip_tiers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET deposits_amount = 0.00,
        vip_tier = NULL,
        vip_week_start = NOW()
    WHERE vip_week_start <= NOW() - INTERVAL '7 days';
END;
$$;

-- 4. Comment on table columns for clarity
COMMENT ON COLUMN public.users.deposits_amount IS 'Total amount deposited during the current 7-day period. Balance spending does not decrease this value.';
COMMENT ON COLUMN public.users.vip_tier IS 'Current VIP status (vip_silver, vip_gold, vip_platinum, vip_diamond, or NULL).';
COMMENT ON COLUMN public.users.vip_week_start IS 'Timestamp when the current 7-day VIP qualification cycle began.';
COMMENT ON COLUMN public.users.inventory_history IS 'JSON array of historical inventory actions (wins, withdrawals, sales).';
COMMENT ON COLUMN public.users.games_history IS 'JSON array of upgrader games played.';
COMMENT ON COLUMN public.users.battles_history IS 'JSON array of case battles participated in.';
