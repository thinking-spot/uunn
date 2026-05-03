-- Defense-in-depth length limits for ContactMessages.
-- Application-level Zod validation already enforces these; the CHECK
-- constraint guards against any future code path that bypasses validation.
ALTER TABLE "ContactMessages"
    ADD CONSTRAINT "ContactMessages_message_length_check"
    CHECK (length("message") BETWEEN 1 AND 5000);

ALTER TABLE "ContactMessages"
    ADD CONSTRAINT "ContactMessages_preferred_contact_length_check"
    CHECK ("preferred_contact" IS NULL OR length("preferred_contact") <= 200);
