-- Add referral_source column to capture where users heard about TradeNest.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS referral_source TEXT;
