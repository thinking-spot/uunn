-- Migration: Union activity log (member-visible)
--
-- A lightweight audit trail per union. All members can read; only the
-- server (via supabaseAdmin in server actions) writes. Events are
-- intentionally non-sensitive metadata — anything that members can
-- already observe (a join, a promotion, a vote opening). Encrypted
-- content (message bodies, vote choices, doc bodies) is never logged
-- here.

CREATE TABLE IF NOT EXISTS "UnionActivity" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    -- The user who took the action. NULL if the action was system-triggered
    -- (e.g. a member self-joining via secure invite — actor IS the target).
    "actor_id" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
    -- Short string discriminator. Treated as an enum at the app level.
    -- Known values today:
    --   'member_joined', 'member_removed', 'member_promoted',
    --   'vote_opened', 'vote_closed',
    --   'document_created',
    --   'alliance_accepted'
    "kind" TEXT NOT NULL,
    -- Optional target reference — meaning depends on `kind`. For
    -- member_* this is the affected user; for vote_* it's the vote id;
    -- for document_created it's the document id; for alliance_accepted
    -- it's the other union's id.
    "target_id" UUID,
    -- Human-readable label snapshotted at write time (a username, a
    -- vote/document/union name) so the log keeps working even if the
    -- referenced row is renamed or deleted later.
    "target_label" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_union_activity_union_created"
    ON "UnionActivity" ("union_id", "created_at" DESC);

ALTER TABLE "UnionActivity" ENABLE ROW LEVEL SECURITY;

-- Members of the union can read its activity log. Anyone outside (and
-- unauthenticated callers) cannot.
DROP POLICY IF EXISTS "Members Read Activity" ON "UnionActivity";
CREATE POLICY "Members Read Activity" ON "UnionActivity" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "UnionActivity".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- INSERT is server-side only (supabaseAdmin bypasses RLS). Deliberately
-- no INSERT policy for the anon/authenticated roles.
