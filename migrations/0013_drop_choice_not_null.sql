-- Migration 0013: Drop NOT NULL on VoteResponses.choice (C1 follow-up)
--
-- Migration 0011 swapped the CHECK constraint to allow `choice IS NULL` when
-- the encrypted blob+iv are populated, but the column-level NOT NULL set in
-- the original schema (0000) was never dropped. Both rules apply, and the
-- column-level rule still rejected encrypted casts. Net effect: every new
-- (encrypted) vote cast failed with 23502.
--
-- Safe to re-run; ALTER COLUMN ... DROP NOT NULL is idempotent.

ALTER TABLE "VoteResponses" ALTER COLUMN "choice" DROP NOT NULL;
