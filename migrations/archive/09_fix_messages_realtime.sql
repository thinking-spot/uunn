-- 1. Enable RLS (just in case)
ALTER TABLE "Messages" ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Messages" ON "Messages";
DROP POLICY IF EXISTS "Public Insert Messages" ON "Messages";
DROP POLICY IF EXISTS "Members Read Messages" ON "Messages";
DROP POLICY IF EXISTS "Members Insert Messages" ON "Messages";

-- 3. Add Members Read Policy (Simple Check)
-- Allows reading messages if you are in the union (checked via Memberships)
CREATE POLICY "Members Read Messages" ON "Messages" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Messages".union_id
    AND m.user_id = auth.uid()
  )
);

-- 4. Add Members Insert Policy (Simple Check)
-- Allows inserting if you are the sender
CREATE POLICY "Members Insert Messages" ON "Messages" FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- 5. Enable Realtime Replication
-- This is critical for the "Insert" event to reach the client
BEGIN;
  -- Remove if already exists to handle idempotency loosely (Postgres doesn't have "ADD IF NOT EXISTS" for publication tables easily)
  -- So we just try to add it. If it fails, it might be already added.
  -- Better: DO block.
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
