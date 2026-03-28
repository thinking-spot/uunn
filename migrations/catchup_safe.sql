-- ============================================================
-- SAFE CATCH-UP MIGRATION
-- Adds all missing tables and columns WITHOUT dropping anything.
-- Safe to run on a database with: Users, Unions, Memberships, Messages, PushSubscriptions
-- ============================================================

-- ============================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Unions: add discovery columns (from 0002)
ALTER TABLE "Unions" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Unions" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Unions" ADD COLUMN IF NOT EXISTS "is_public" BOOLEAN DEFAULT true;

-- ============================================================
-- 2. CREATE MISSING TABLES
-- ============================================================

-- UnionInvites (Secure Links)
CREATE TABLE IF NOT EXISTS "UnionInvites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "encrypted_union_key" TEXT NOT NULL,
  "invite_public_key" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ
);

-- Documents
CREATE TABLE IF NOT EXISTS "Documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "content" TEXT DEFAULT '',
  "content_blob" TEXT DEFAULT '',
  "iv" TEXT DEFAULT '',
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Votes (Polls)
CREATE TABLE IF NOT EXISTS "Votes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "vote_type" TEXT NOT NULL DEFAULT 'yes_no',
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "closes_at" TIMESTAMPTZ
);

-- Vote Attachments
CREATE TABLE IF NOT EXISTS "VoteAttachments" (
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "document_id" UUID NOT NULL REFERENCES "Documents"("id") ON DELETE CASCADE,
  PRIMARY KEY ("vote_id", "document_id")
);

-- Vote Responses
CREATE TABLE IF NOT EXISTS "VoteResponses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "choice" TEXT NOT NULL,
  "encrypted_meta" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("vote_id", "user_id")
);

-- Union Join Requests (from 0002)
CREATE TABLE IF NOT EXISTS "UnionJoinRequests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("user_id", "union_id")
);

-- Union Alliances (from 0002)
CREATE TABLE IF NOT EXISTS "UnionAlliances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "union_a_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "union_b_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiated_by_union_id" UUID REFERENCES "Unions"("id"),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    CHECK ("union_a_id" < "union_b_id"),
    UNIQUE("union_a_id", "union_b_id")
);

-- Alliance Keys (from 0005)
CREATE TABLE IF NOT EXISTS "AllianceKeys" (
    "alliance_id" UUID NOT NULL REFERENCES "UnionAlliances"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "encrypted_shared_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY ("alliance_id", "user_id")
);

-- Alliance Messages (from 0005)
CREATE TABLE IF NOT EXISTS "AllianceMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "alliance_id" UUID NOT NULL REFERENCES "UnionAlliances"("id") ON DELETE CASCADE,
    "sender_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "content_blob" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ENABLE RLS ON ALL NEW TABLES
-- ============================================================

ALTER TABLE "UnionInvites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoteAttachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoteResponses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnionJoinRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnionAlliances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AllianceKeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AllianceMessages" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- --- Users ---
DROP POLICY IF EXISTS "Public Read Users" ON "Users";
CREATE POLICY "Authenticated Read Users" ON "Users" FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- --- Unions ---
CREATE POLICY "Public Read Unions" ON "Unions" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Unions" ON "Unions";
CREATE POLICY "Authenticated Insert Unions" ON "Unions" FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- --- Memberships ---
DROP POLICY IF EXISTS "Public Read Memberships" ON "Memberships";
DROP POLICY IF EXISTS "Users View Own Memberships" ON "Memberships";
CREATE POLICY "Authenticated Read Memberships" ON "Memberships" FOR SELECT USING (
    auth.uid() IS NOT NULL
);
DROP POLICY IF EXISTS "Public Insert Memberships" ON "Memberships";
CREATE POLICY "Authenticated Insert Memberships" ON "Memberships" FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);
CREATE POLICY "Admins Delete Members" ON "Memberships" FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "Memberships".union_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
);

-- --- Messages ---
CREATE POLICY "Members Read Messages" ON "Messages" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "Messages".union_id
        AND m.user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Members Insert Messages" ON "Messages";
CREATE POLICY "Members Insert Messages" ON "Messages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Messages".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- UnionInvites ---
CREATE POLICY "Authenticated Read Invites" ON "UnionInvites" FOR SELECT USING (
    auth.uid() IS NOT NULL
);
CREATE POLICY "Members Create Invites" ON "UnionInvites" FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "UnionInvites".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- Documents ---
CREATE POLICY "Members Read Documents" ON "Documents" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "Documents".union_id
        AND m.user_id = auth.uid()
    )
);
CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Documents".union_id
        AND "Memberships".user_id = auth.uid()
    )
);
CREATE POLICY "Members Update Documents" ON "Documents" FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "Documents".union_id
        AND m.user_id = auth.uid()
    )
);

-- --- Votes ---
CREATE POLICY "Members Read Votes" ON "Votes" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Votes".union_id
        AND "Memberships".user_id = auth.uid()
    )
);
CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Votes".union_id
        AND "Memberships".user_id = auth.uid()
    )
);
CREATE POLICY "Creator Updates Votes" ON "Votes" FOR UPDATE USING (
    auth.uid() = created_by
);

-- --- VoteAttachments ---
CREATE POLICY "Members Read Attachments" ON "VoteAttachments" FOR SELECT USING (true);
CREATE POLICY "Creators Attach Docs" ON "VoteAttachments" FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM "Votes" v
        WHERE v.id = vote_id
        AND v.created_by = auth.uid()
    )
);

-- --- VoteResponses ---
CREATE POLICY "Members Read Responses" ON "VoteResponses" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = "VoteResponses".vote_id)
        AND "Memberships".user_id = auth.uid()
    )
);
CREATE POLICY "Members Cast Vote" ON "VoteResponses" FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = "VoteResponses".vote_id)
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- UnionJoinRequests ---
CREATE POLICY "Users View Own Join Requests" ON "UnionJoinRequests" FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Users Create Join Requests" ON "UnionJoinRequests" FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
CREATE POLICY "Members View Join Requests" ON "UnionJoinRequests" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "UnionJoinRequests".union_id
        AND m.user_id = auth.uid()
    )
);
CREATE POLICY "Members Manage Join Requests" ON "UnionJoinRequests" FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "UnionJoinRequests".union_id
        AND m.user_id = auth.uid()
    )
);

-- --- UnionAlliances ---
CREATE POLICY "Members View Alliances" ON "UnionAlliances" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE (m.union_id = "UnionAlliances".union_a_id OR m.union_id = "UnionAlliances".union_b_id)
        AND m.user_id = auth.uid()
    )
);
CREATE POLICY "Authenticated Create Alliances" ON "UnionAlliances" FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- --- AllianceKeys ---
CREATE POLICY "Users Read Own Alliance Keys" ON "AllianceKeys" FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Alliance Admin Insert Keys" ON "AllianceKeys" FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM "UnionAlliances" ua
        JOIN "Memberships" m ON (
            m.union_id = ua.union_a_id OR m.union_id = ua.union_b_id
        )
        WHERE ua.id = "AllianceKeys".alliance_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
);

-- --- AllianceMessages ---
CREATE POLICY "Alliance Members Read Messages" ON "AllianceMessages" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "AllianceKeys" ak
        WHERE ak.alliance_id = "AllianceMessages".alliance_id
        AND ak.user_id = auth.uid()
    )
);
CREATE POLICY "Alliance Members Insert Messages" ON "AllianceMessages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM "AllianceKeys" ak
        WHERE ak.alliance_id = "AllianceMessages".alliance_id
        AND ak.user_id = auth.uid()
    )
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON "Memberships"(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_union_id ON "Memberships"(union_id);
CREATE INDEX IF NOT EXISTS idx_messages_union_id_created ON "Messages"(union_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_union_id ON "Documents"(union_id);
CREATE INDEX IF NOT EXISTS idx_votes_union_id ON "Votes"(union_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_vote_id ON "VoteResponses"(vote_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_union_status ON "UnionJoinRequests"(union_id, status);
CREATE INDEX IF NOT EXISTS idx_alliance_messages_alliance_created ON "AllianceMessages"(alliance_id, created_at);
CREATE INDEX IF NOT EXISTS idx_alliance_keys_alliance_id ON "AllianceKeys"(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_keys_user_id ON "AllianceKeys"(user_id);
CREATE INDEX IF NOT EXISTS idx_alliances_status ON "UnionAlliances"(status);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON "PushSubscriptions"(user_id);

-- ============================================================
-- 6. REALTIME
-- ============================================================

BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'Messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Messages";
  END IF;
END
$$;
COMMIT;

BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'AllianceMessages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "AllianceMessages";
  END IF;
END
$$;
COMMIT;
