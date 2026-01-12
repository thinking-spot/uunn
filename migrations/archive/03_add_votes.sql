-- Migration to add Voting System
-- Run this in the Supabase Dashboard -> SQL Editor

-- 1. Votes Table
CREATE TABLE "Votes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL,
  
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
  "vote_type" TEXT NOT NULL DEFAULT 'yes_no', -- 'yes_no', 'multiple_choice' (future)
  
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "closes_at" TIMESTAMPTZ -- Optional auto-close time
);

-- 2. Vote Responses Table (Who voted what)
CREATE TABLE "VoteResponses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  
  "choice" TEXT NOT NULL, -- 'yes', 'no', 'abstain', or Option ID
  "encrypted_meta" TEXT, -- Optional: Encrypted comment/reason? (Future)
  
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one vote per user per poll
  UNIQUE("vote_id", "user_id")
);

-- 3. RLS Policies

ALTER TABLE "Votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoteResponses" ENABLE ROW LEVEL SECURITY;

-- Votes: Members can READ
CREATE POLICY "Members Read Votes" ON "Votes" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = "Votes".union_id
    AND "Memberships".user_id = auth.uid()
  )
);

-- Votes: Members can INSERT (Create Polls)
CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = union_id
    AND "Memberships".user_id = auth.uid()
  )
);

-- Votes: Only Admin (or Creator) can UPDATE (Close Polls)
CREATE POLICY "Creator Updates Votes" ON "Votes" FOR UPDATE USING (
  auth.uid() = created_by
);

-- Responses: Members can READ (Transparency - everyone sees who voted what? Or just totals?)
-- For Union democracy, often transparency is valued, but sometimes secret ballot.
-- Let's default to: Members can see ALL responses (Transparency).
CREATE POLICY "Members Read Responses" ON "VoteResponses" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = "VoteResponses".vote_id)
    AND "Memberships".user_id = auth.uid()
  )
);

-- Responses: Members can INSERT (Vote)
CREATE POLICY "Members Cast Vote" ON "VoteResponses" FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM "Memberships"
    WHERE "Memberships".union_id = (SELECT union_id FROM "Votes" WHERE id = vote_id)
    AND "Memberships".user_id = auth.uid()
  )
);

-- Enable Realtime for Votes (so UI updates instantly)
-- (User needs to toggle this in Dashboard, but we can't do it via SQL usually)
