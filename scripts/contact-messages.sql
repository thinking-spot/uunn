-- Run in the Supabase SQL editor (uses service_role implicitly there).
-- Most recent first; tweak LIMIT and the WHERE filter as needed.

SELECT
    id,
    created_at AT TIME ZONE 'UTC' AS created_utc,
    preferred_contact,
    message
FROM "ContactMessages"
-- WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
