-- Migration: Encrypt Documents
-- Adds content_blob and iv columns for E2E encrypted document content.
-- The plaintext 'content' column is kept temporarily for backward compatibility
-- but will no longer be written to by the application.

ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "content_blob" TEXT DEFAULT '';
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "iv" TEXT DEFAULT '';
