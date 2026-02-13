-- Migration: Add Push Subscriptions for Web Push
-- Description: Stores VAPID subscription endpoints for users.

CREATE TABLE "PushSubscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL,
  "auth_key" TEXT NOT NULL,
  "p256dh_key" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one subscription per device/endpoint globally (endpoint is unique from browser)
  UNIQUE("endpoint")
);

-- RLS
ALTER TABLE "PushSubscriptions" ENABLE ROW LEVEL SECURITY;

-- Users can View/Delete their own subscriptions
CREATE POLICY "Users Manage Own Subscriptions" ON "PushSubscriptions" FOR ALL USING (
  auth.uid() = user_id
);

-- Note: We do NOT want general members to read subscriptions. Only the Server (Service Role) needs to read them.
-- So no "Members Read" policy here.
