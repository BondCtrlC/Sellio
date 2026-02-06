-- Add bank account fields to creators
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(100);
