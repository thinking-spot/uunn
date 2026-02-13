-- uunn.io V1 Schema (Consolidated)
-- Date: 2024-01-11
-- Includes: Users, Unions, Memberships, Messages, Invites, Votes, Documents

-- 1. CLEANUP (Drop All)
DROP TABLE IF EXISTS "VoteAttachments";
DROP TABLE IF EXISTS "VoteResponses";
DROP TABLE IF EXISTS "Votes";
DROP TABLE IF EXISTS "UnionInvites";
DROP TABLE IF EXISTS "Documents";
DROP TABLE IF EXISTS "Messages";
DROP TABLE IF EXISTS "Memberships";
DROP TABLE IF EXISTS "Unions";
DROP TABLE IF EXISTS "Users";

-- 2. TABLES

-- Users
CREATE TABLE "Users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "public_key" TEXT,
  "encrypted_vault" TEXT, -- Key Backup
  "vault_salt" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Unions
CREATE TABLE "Unions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "invite_code" TEXT UNIQUE NOT NULL,
  "shared_key_enc" TEXT,
  "image_url" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "creator_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Memberships
CREATE TABLE "Memberships" (
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "role" TEXT DEFAULT 'member', -- 'admin', 'member'
  "encrypted_shared_key" TEXT,
  "joined_at" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("user_id", "union_id")
);

-- Messages
CREATE TABLE "Messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "sender_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "content_blob" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- UnionInvites (Secure Links)
CREATE TABLE "UnionInvites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "encrypted_union_key" TEXT NOT NULL,
  "invite_public_key" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ
);

-- Documents
CREATE TABLE "Documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "content" TEXT DEFAULT '',
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Votes (Polls)
CREATE TABLE "Votes" (
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
CREATE TABLE "VoteAttachments" (
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "document_id" UUID NOT NULL REFERENCES "Documents"("id") ON DELETE CASCADE,
  PRIMARY KEY ("vote_id", "document_id")
);

-- Vote Responses
CREATE TABLE "VoteResponses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "choice" TEXT NOT NULL,
  "encrypted_meta" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("vote_id", "user_id")
);

-- 3. SECURITY (RLS)

ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Unions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnionInvites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoteAttachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoteResponses" ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified / Fixed Versions)

-- Users
CREATE POLICY "Public Read Users" ON "Users" FOR SELECT USING (true);

-- Unions
CREATE POLICY "Public Read Unions" ON "Unions" FOR SELECT USING (true);
CREATE POLICY "Public Insert Unions" ON "Unions" FOR INSERT WITH CHECK (true);

-- Memberships
CREATE POLICY "Public Read Memberships" ON "Memberships" FOR SELECT USING (true);
CREATE POLICY "Public Insert Memberships" ON "Memberships" FOR INSERT WITH CHECK (true);
-- Fix: Users see own memberships explicitly
CREATE POLICY "Users View Own Memberships" ON "Memberships" FOR SELECT USING (auth.uid() = user_id);

-- Invites
CREATE POLICY "Public Read Invites" ON "UnionInvites" FOR SELECT USING (true);
CREATE POLICY "Members Create Invites" ON "UnionInvites" FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM "Memberships" 
    WHERE "Memberships".union_id = "UnionInvites".union_id 
    AND "Memberships".user_id = auth.uid()
  )
);

-- Messages (Optimized for Realtime)
CREATE POLICY "Members Read Messages" ON "Messages" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Messages".union_id
    AND m.user_id = auth.uid()
  )
);
CREATE POLICY "Members Insert Messages" ON "Messages" FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Documents
CREATE POLICY "Members Read Documents" ON "Documents" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);
-- Simplified Insert Policy (Debugged)
CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
  auth.uid() = created_by
);
CREATE POLICY "Members Update Documents" ON "Documents" FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);

-- Votes
CREATE POLICY "Members Read Votes" ON "Votes" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = "Votes".union_id
    AND "Memberships".user_id = auth.uid()
  )
);
-- Simplified Insert Policy
CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
  auth.uid() = created_by
);
CREATE POLICY "Creator Updates Votes" ON "Votes" FOR UPDATE USING (
  auth.uid() = created_by
);

-- Vote Attachments
CREATE POLICY "Members Read Attachments" ON "VoteAttachments" FOR SELECT USING (true);
CREATE POLICY "Creators Attach Docs" ON "VoteAttachments" FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM "Votes" v
        WHERE v.id = vote_id
        AND v.created_by = auth.uid()
    )
);

-- Vote Responses
CREATE POLICY "Members Read Responses" ON "VoteResponses" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = "VoteResponses".vote_id)
    AND "Memberships".user_id = auth.uid()
  )
);
CREATE POLICY "Members Cast Vote" ON "VoteResponses" FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 4. REALTIME SETUP
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
