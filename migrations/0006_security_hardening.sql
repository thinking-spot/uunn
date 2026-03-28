-- Migration: Security Hardening
-- Fixes RLS policy gaps and adds database indexes for performance.

-- ============================================================
-- 1. FIX RLS POLICIES
-- ============================================================

-- --- Messages: INSERT must verify union membership ---
DROP POLICY IF EXISTS "Members Insert Messages" ON "Messages";
CREATE POLICY "Members Insert Messages" ON "Messages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Messages".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- AllianceMessages: INSERT must verify alliance membership ---
DROP POLICY IF EXISTS "Alliance Members Insert Messages" ON "AllianceMessages";
CREATE POLICY "Alliance Members Insert Messages" ON "AllianceMessages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM "AllianceKeys" ak
        WHERE ak.alliance_id = "AllianceMessages".alliance_id
        AND ak.user_id = auth.uid()
    )
);

-- --- AllianceKeys: INSERT must verify membership in one of the allied unions ---
DROP POLICY IF EXISTS "Authenticated Insert Alliance Keys" ON "AllianceKeys";
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

-- --- Restrict public READ on Users (only authenticated users) ---
DROP POLICY IF EXISTS "Public Read Users" ON "Users";
CREATE POLICY "Authenticated Read Users" ON "Users" FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- --- Restrict public READ on Memberships ---
DROP POLICY IF EXISTS "Public Read Memberships" ON "Memberships";
DROP POLICY IF EXISTS "Users View Own Memberships" ON "Memberships";
CREATE POLICY "Authenticated Read Memberships" ON "Memberships" FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- --- Restrict Memberships INSERT to authenticated users ---
DROP POLICY IF EXISTS "Public Insert Memberships" ON "Memberships";
CREATE POLICY "Authenticated Insert Memberships" ON "Memberships" FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- --- Restrict Unions INSERT to authenticated users ---
DROP POLICY IF EXISTS "Public Insert Unions" ON "Unions";
CREATE POLICY "Authenticated Insert Unions" ON "Unions" FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- --- Restrict Invites READ to authenticated users ---
DROP POLICY IF EXISTS "Public Read Invites" ON "UnionInvites";
CREATE POLICY "Authenticated Read Invites" ON "UnionInvites" FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- --- Documents: INSERT must verify membership ---
DROP POLICY IF EXISTS "Members Create Documents" ON "Documents";
CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Documents".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- Votes: INSERT must verify membership ---
DROP POLICY IF EXISTS "Members Create Votes" ON "Votes";
CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = "Votes".union_id
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- VoteResponses: INSERT must verify membership ---
DROP POLICY IF EXISTS "Members Cast Vote" ON "VoteResponses";
CREATE POLICY "Members Cast Vote" ON "VoteResponses" FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM "Memberships"
        WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = "VoteResponses".vote_id)
        AND "Memberships".user_id = auth.uid()
    )
);

-- --- Add DELETE policies ---
CREATE POLICY "Admins Delete Members" ON "Memberships" FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "Memberships".union_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
);

-- ============================================================
-- 2. ADD INDEXES
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
