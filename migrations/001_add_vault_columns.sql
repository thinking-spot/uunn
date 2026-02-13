-- Add missing columns for client-side encryption vault to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "encrypted_vault" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "vault_salt" TEXT;
