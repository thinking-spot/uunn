-- Migration: per-vote quorum threshold
--
-- `closes_at` already exists on Votes from the v1 schema (migration 0000)
-- but isn't currently set by the create form. This migration adds the
-- missing piece — an optional per-vote quorum percentage — so the UI
-- can show "X of Y members voted; quorum N% met/not met" on open votes.
--
-- Stored as an integer percent (e.g. 50 = "half the union must vote
-- for this to count"). NULL means no quorum requirement.

ALTER TABLE "Votes"
    ADD COLUMN IF NOT EXISTS "quorum_percent" SMALLINT
    CHECK ("quorum_percent" IS NULL OR ("quorum_percent" BETWEEN 1 AND 100));
