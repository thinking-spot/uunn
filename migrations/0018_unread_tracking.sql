-- Migration: Per-channel unread tracking
--
-- Adds a `last_read_at` timestamp to the two membership-row tables
-- (Memberships for union channels, AllianceKeys for alliance channels)
-- so the unread-count server action can count messages newer than the
-- timestamp without a separate ChannelReads table.
--
-- Defaults to NOW() so existing memberships start clean — nobody opens
-- the app to a "you have 47,000 unread messages" badge after this ships.

ALTER TABLE "Memberships"
    ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "AllianceKeys"
    ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- The unread query filters Messages / AllianceMessages on (channel_id,
-- created_at > last_read_at, sender_id <> me). The existing Messages
-- and AllianceMessages indexes cover (union_id/alliance_id, created_at).
