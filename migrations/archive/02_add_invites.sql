-- Migration to add Secure Invites
-- Run this in the Supabase Dashboard -> SQL Editor

CREATE TABLE "UnionInvites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "encrypted_union_key" TEXT NOT NULL, -- Union Key encrypted with the Invite's Public Key
  "invite_public_key" TEXT NOT NULL,   -- The Public Key corresponding to the Private Key in the URL
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "expires_at" TIMESTAMPTZ -- Optional expiration
);

-- RLS Policies for Invites
ALTER TABLE "UnionInvites" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read an invite if they have the ID (validation happens via key decryption anyway)
CREATE POLICY "Public Read Invites" ON "UnionInvites" FOR SELECT USING (true);

-- Allow Members to create invites
CREATE POLICY "Members Create Invites" ON "UnionInvites" FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM "Memberships" 
    WHERE "Memberships".union_id = "UnionInvites".union_id 
    AND "Memberships".user_id = auth.uid()
  )
);
