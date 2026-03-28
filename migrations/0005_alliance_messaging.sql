-- Migration: Alliance Messaging
-- Adds tables for cross-union encrypted messaging between allied unions.

-- 1. Alliance Keys (per-member wrapped shared key for the alliance channel)
CREATE TABLE "AllianceKeys" (
    "alliance_id" UUID NOT NULL REFERENCES "UnionAlliances"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "encrypted_shared_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY ("alliance_id", "user_id")
);

-- 2. Alliance Messages (encrypted, same structure as Messages)
CREATE TABLE "AllianceMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "alliance_id" UUID NOT NULL REFERENCES "UnionAlliances"("id") ON DELETE CASCADE,
    "sender_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "content_blob" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE "AllianceKeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AllianceMessages" ENABLE ROW LEVEL SECURITY;

-- Alliance Keys: users can read their own key
CREATE POLICY "Users Read Own Alliance Keys" ON "AllianceKeys" FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Authenticated Insert Alliance Keys" ON "AllianceKeys" FOR INSERT WITH CHECK (true);

-- Alliance Messages: members of either union can read
CREATE POLICY "Alliance Members Read Messages" ON "AllianceMessages" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "AllianceKeys" ak
        WHERE ak.alliance_id = "AllianceMessages".alliance_id
        AND ak.user_id = auth.uid()
    )
);
CREATE POLICY "Alliance Members Insert Messages" ON "AllianceMessages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- 4. Enable Realtime on AllianceMessages
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
