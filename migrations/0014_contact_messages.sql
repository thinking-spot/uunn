-- Public contact form submissions from the homepage.
-- Anonymous: no user_id, no IP storage.
CREATE TABLE "ContactMessages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "message" TEXT NOT NULL,
    "preferred_contact" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "ContactMessages" ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (server actions via supabaseAdmin) can read or write.

CREATE INDEX "ContactMessages_created_at_idx" ON "ContactMessages" ("created_at" DESC);
