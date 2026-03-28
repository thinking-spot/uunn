-- Store the union key encrypted with a key derived from the invite code.
-- This allows users who join via invite code to obtain the union encryption key
-- without requiring an admin to be online for manual key distribution.
ALTER TABLE "Unions" ADD COLUMN IF NOT EXISTS invite_key_blob TEXT;
ALTER TABLE "Unions" ADD COLUMN IF NOT EXISTS invite_key_salt TEXT;
