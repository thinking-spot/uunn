-- Migration 0011: Encrypt vote responses (C1)
--
-- Vote choices were stored as plaintext ('yes' | 'no' | 'abstain') alongside
-- user_id, giving the server (or anyone with DB access) a complete record
-- of who voted what. Going forward, choices are encrypted client-side with
-- the union AES-GCM key and the server only sees an opaque ciphertext.
--
-- Migration strategy:
--   * Add choice_blob and iv columns alongside the legacy `choice` column.
--   * Loosen the CHECK constraint added in 0010 to allow NULL `choice`
--     (new rows leave it NULL; legacy rows keep their plaintext value).
--   * No backfill — legacy rows remain plaintext-readable. Optional future
--     migration: re-encrypt them on next cast or admin sweep.

ALTER TABLE "VoteResponses" ADD COLUMN IF NOT EXISTS "choice_blob" TEXT;
ALTER TABLE "VoteResponses" ADD COLUMN IF NOT EXISTS "iv" TEXT;

-- Drop the strict CHECK from 0010 and replace with a permissive variant
-- that allows NULL `choice` for the new encrypted path.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vote_responses_choice_check'
    ) THEN
        ALTER TABLE "VoteResponses" DROP CONSTRAINT vote_responses_choice_check;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vote_responses_choice_or_blob_check'
    ) THEN
        ALTER TABLE "VoteResponses"
            ADD CONSTRAINT vote_responses_choice_or_blob_check
            CHECK (
                (choice IS NULL AND choice_blob IS NOT NULL AND iv IS NOT NULL)
                OR
                (choice IN ('yes', 'no', 'abstain'))
            );
    END IF;
END$$;
