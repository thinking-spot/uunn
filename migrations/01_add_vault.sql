-- Migration to add Key Backup Vault
-- Run this in the Supabase Dashboard -> SQL Editor

ALTER TABLE "Users"
ADD COLUMN "encrypted_vault" TEXT,
ADD COLUMN "vault_salt" TEXT;

COMMENT ON COLUMN "Users"."encrypted_vault" IS 'User Private Key encrypted with their Password (PBKDF2+AES-GCM)';
COMMENT ON COLUMN "Users"."vault_salt" IS 'Salt used for PBKDF2 key derivation';
