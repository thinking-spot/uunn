-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS "Messages";
DROP TABLE IF EXISTS "Memberships";
DROP TABLE IF EXISTS "Unions";
DROP TABLE IF EXISTS "Users";

-- Users Table
CREATE TABLE "Users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "public_key" TEXT, -- User's public key for E2EE
  "encrypted_vault" TEXT, -- Encrypted private key backup
  "vault_salt" TEXT, -- Salt used for vault encryption
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Unions Table
CREATE TABLE "Unions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "invite_code" TEXT UNIQUE NOT NULL,
  "shared_key_enc" TEXT, -- Shared key encrypted with Creator's public key
  "image_url" TEXT,
  "location" TEXT,
  "description" TEXT,
  "industry" TEXT,
  "is_public" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "creator_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Memberships Table
CREATE TABLE "Memberships" (
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "role" TEXT DEFAULT 'member', -- 'admin', 'member'
  "encrypted_shared_key" TEXT, -- The union's shared key encrypted with THIS user's public key
  "joined_at" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("user_id", "union_id")
);

-- Messages Table
CREATE TABLE "Messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "sender_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "content_blob" TEXT NOT NULL, -- Encrypted content (base64)
  "iv" TEXT NOT NULL, -- Initialization vector
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional for MVP but good practice
-- For now, allowing public access to simplify the "Service Role" vs "Client" transition
-- In a real app, strict policies would be added here.
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Unions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Messages" ENABLE ROW LEVEL SECURITY;

-- Lazy Policies for MVP (Open Access for Authenticated Users)
CREATE POLICY "Public Read" ON "Users" FOR SELECT USING (true);
CREATE POLICY "Public Read Unions" ON "Unions" FOR SELECT USING (true);
CREATE POLICY "Public Insert Unions" ON "Unions" FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Memberships" ON "Memberships" FOR SELECT USING (true);
CREATE POLICY "Public Insert Memberships" ON "Memberships" FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Messages" ON "Messages" FOR SELECT USING (true);
CREATE POLICY "Public Insert Messages" ON "Messages" FOR INSERT WITH CHECK (true);

-- Functions needed for Realtime to work effectively?
-- Supabase Realtime works out of the box with "postgres_changes".
-- You must ENABLE Realtime on the "Messages" table in the Dashboard: 
-- Database -> Replication -> Source -> supabase_realtime -> Toggle ON for "Messages"
