-- Migration: Add Union Discovery, Join Requests, and Alliances
-- Description: Enables searching for unions and connecting (joining or allying).

-- 1. Modify Unions Table
ALTER TABLE "Unions"
ADD COLUMN "location" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "is_public" BOOLEAN DEFAULT true;

-- 2. Union Join Requests (User -> Union)
CREATE TABLE "UnionJoinRequests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE("user_id", "union_id")
);

-- 3. Union Alliances (Union <-> Union)
CREATE TABLE "UnionAlliances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "union_a_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "union_b_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'rejected'
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to prevent duplicate pairs (e.g. A-B and B-A)
    CHECK ("union_a_id" < "union_b_id"),
    UNIQUE("union_a_id", "union_b_id")
);

-- 4. RLS Policies

ALTER TABLE "UnionJoinRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnionAlliances" ENABLE ROW LEVEL SECURITY;

-- Join Requests Policies
-- Users can see their own requests
CREATE POLICY "Users View Own Join Requests" ON "UnionJoinRequests" FOR SELECT USING (
    auth.uid() = user_id
);

-- Users can create requests (for any union)
CREATE POLICY "Users Create Join Requests" ON "UnionJoinRequests" FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Union Admins (or Members) can see requests for THEIR union
CREATE POLICY "Members View Join Requests" ON "UnionJoinRequests" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "UnionJoinRequests".union_id
        AND m.user_id = auth.uid()
    )
);

-- Union Admins can UPDATE requests (Accept/Reject)
-- For MVP, any member can "Accept" (We don't strictly enforce Admin role yet, but ideally check role='admin')
CREATE POLICY "Members Manage Join Requests" ON "UnionJoinRequests" FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE m.union_id = "UnionJoinRequests".union_id
        AND m.user_id = auth.uid()
    )
);


-- Alliances Policies
-- Members of EITHER union can view the alliance status
CREATE POLICY "Members View Alliances" ON "UnionAlliances" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Memberships" m
        WHERE (m.union_id = "UnionAlliances".union_a_id OR m.union_id = "UnionAlliances".union_b_id)
        AND m.user_id = auth.uid()
    )
);

-- Members can Create Alliance *Requests* (Initiate)
-- Must be a member of one of the unions involved (The "Initiator" union)
-- But typically we initiate FROM Union A TO Union B.
-- We can't easily enforce "Initiator" in RLS INSERT without extra data.
-- Simplified: Allow authenticated users to insert, server-side action handles logic.
CREATE POLICY "Authenticated Create Alliances" ON "UnionAlliances" FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);
