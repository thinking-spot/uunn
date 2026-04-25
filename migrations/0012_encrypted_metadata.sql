-- Migration 0012: Encrypt document/vote titles & vote descriptions (H4)
--
-- Plaintext titles ("Strike vote March 2026", "Acme Workers Solidarity")
-- give a server-side adversary (or anyone with DB access) a clear picture
-- of organizing activity even when message bodies are encrypted. Going
-- forward, these are encrypted client-side with the union AES-GCM key
-- (with row-id-bound AAD) and the server only sees an opaque ciphertext
-- alongside a generic placeholder in the legacy `title` column.
--
-- Backward compatibility: the existing `title`/`description` columns remain.
-- Legacy rows keep their plaintext values; new rows store a generic
-- placeholder there (e.g. "Encrypted") and the real value in the blob.
--
-- Safe to re-run.

ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "title_blob" TEXT;
ALTER TABLE "Documents" ADD COLUMN IF NOT EXISTS "title_iv" TEXT;

ALTER TABLE "Votes" ADD COLUMN IF NOT EXISTS "title_blob" TEXT;
ALTER TABLE "Votes" ADD COLUMN IF NOT EXISTS "title_iv" TEXT;
ALTER TABLE "Votes" ADD COLUMN IF NOT EXISTS "description_blob" TEXT;
ALTER TABLE "Votes" ADD COLUMN IF NOT EXISTS "description_iv" TEXT;
