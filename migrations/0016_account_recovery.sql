-- Account recovery via BIP-39 mnemonic.
--
-- recovery_vault     — same shape as encrypted_vault, encrypted under
--                      PBKDF2(normalized_mnemonic, recovery_salt).
-- recovery_salt      — base64 salt for the recovery vault's PBKDF2 derivation.
-- recovery_hash      — bcrypt(sha256(normalized_mnemonic)). Used during the
--                      reset flow to authenticate a vault overwrite.
-- encrypted_recovery_key — the mnemonic itself, encrypted under the user's
--                      password-derived key (reuses vault_salt). Lets the
--                      settings page reveal the mnemonic after password
--                      re-entry. NULL if the user hasn't set up recovery yet.
-- notification_email — optional, opaque to the server. Used only for sending
--                      account-event notifications (NOT for recovery).

ALTER TABLE "Users" ADD COLUMN "recovery_vault" TEXT;
ALTER TABLE "Users" ADD COLUMN "recovery_salt" TEXT;
ALTER TABLE "Users" ADD COLUMN "recovery_hash" TEXT;
ALTER TABLE "Users" ADD COLUMN "encrypted_recovery_key" TEXT;
ALTER TABLE "Users" ADD COLUMN "notification_email" TEXT;

-- Defense-in-depth size limits. Values are well above the largest realistic
-- payload (a v2 vault for an RSA-2048 key is ~2.4KB).
ALTER TABLE "Users"
    ADD CONSTRAINT "Users_recovery_vault_size_check"
    CHECK ("recovery_vault" IS NULL OR length("recovery_vault") <= 50000);

ALTER TABLE "Users"
    ADD CONSTRAINT "Users_recovery_salt_size_check"
    CHECK ("recovery_salt" IS NULL OR length("recovery_salt") <= 200);

ALTER TABLE "Users"
    ADD CONSTRAINT "Users_recovery_hash_size_check"
    CHECK ("recovery_hash" IS NULL OR length("recovery_hash") <= 200);

ALTER TABLE "Users"
    ADD CONSTRAINT "Users_encrypted_recovery_key_size_check"
    CHECK ("encrypted_recovery_key" IS NULL OR length("encrypted_recovery_key") <= 5000);

ALTER TABLE "Users"
    ADD CONSTRAINT "Users_notification_email_size_check"
    CHECK ("notification_email" IS NULL OR length("notification_email") <= 320);
