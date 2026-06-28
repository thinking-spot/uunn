-- Migration: per-recipient invite tracking
--
-- Adds two capabilities to the Secure Invite Link flow:
--
-- 1. A free-form `label` admins set at issuance time so they can tell
--    one invite from another in the issued-invites list ("Mark in
--    accounting", "Day-shift workers", etc). Not sensitive — visible
--    only to admins of the union.
--
-- 2. Single-use tracking: `consumed_by` + `consumed_at` are set when a
--    recipient successfully redeems the invite via
--    joinViaSecureInviteAction. The server then rejects any reuse,
--    closing the "someone else also got the URL and joined as a
--    second account" loophole. Status in the UI is derived: pending
--    if consumed_by IS NULL and not expired; joined if consumed_by
--    IS NOT NULL; expired if consumed_by IS NULL and expires_at
--    has passed.

ALTER TABLE "UnionInvites"
    ADD COLUMN IF NOT EXISTS "label" TEXT;

ALTER TABLE "UnionInvites"
    ADD COLUMN IF NOT EXISTS "consumed_by" UUID REFERENCES "Users"("id") ON DELETE SET NULL;

ALTER TABLE "UnionInvites"
    ADD COLUMN IF NOT EXISTS "consumed_at" TIMESTAMPTZ;

-- Admin-list queries filter by (union_id, consumed_at NULLS FIRST,
-- created_at DESC). The existing PRIMARY KEY on id is fine; no
-- additional index is needed at expected invite volumes.
