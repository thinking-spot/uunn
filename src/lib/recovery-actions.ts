'use server';

/**
 * Server actions for the account-recovery flow.
 *
 * The recovery model is zero-knowledge: the BIP-39 mnemonic is generated
 * client-side and the server only ever sees:
 *   - the recovery vault (private RSA JWK encrypted under the mnemonic-derived KEK)
 *   - a SHA-256 digest of the normalized mnemonic, bcrypt'd for storage,
 *     used solely to authenticate password-reset requests
 *   - the mnemonic encrypted under the user's password-derived KEK
 *     (lets settings reveal it after password re-entry)
 *
 * The server never sees the mnemonic in plaintext.
 */

import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/log';
import { getClientIp } from '@/lib/request-meta';
import crypto from 'node:crypto';

const BCRYPT_COST = 12;

// ─── Public lookup of the recovery vault ──────────────────────────────────
//
// Mirrors getVaultAction's enumeration-resistance pattern: returns a decoy
// blob for unknown usernames so an attacker can't distinguish "no such user"
// from "user exists but you don't have the recovery key".

export async function getRecoveryVaultAction(username: string): Promise<{
    recoveryVault: string;
    recoverySalt: string;
}> {
    const ip = await getClientIp();
    {
        const { allowed } = rateLimit(`recovery-vault-ip:${ip}`, 60, 60_000);
        if (!allowed) return decoyRecoveryVault(username);
    }
    {
        const { allowed } = rateLimit(`recovery-vault:${username}`, 10, 60_000);
        if (!allowed) return decoyRecoveryVault(username);
    }

    if (typeof username !== 'string' || username.length === 0 || username.length > 100) {
        return decoyRecoveryVault(typeof username === 'string' ? username : '');
    }

    const { data } = await supabaseAdmin
        .from('Users')
        .select('recovery_vault, recovery_salt')
        .eq('username', username)
        .single();

    if (!data || !data.recovery_vault || !data.recovery_salt) {
        return decoyRecoveryVault(username);
    }

    return {
        recoveryVault: data.recovery_vault,
        recoverySalt: data.recovery_salt,
    };
}

function decoyRecoveryVault(username: string): { recoveryVault: string; recoverySalt: string } {
    const secret = process.env.AUTH_SECRET || 'uunn-decoy-fallback-secret';
    const seed = crypto.createHmac('sha256', secret).update(`recovery-vault:${username}`).digest();
    const fakeIv = seed.subarray(0, 12).toString('base64');
    const ctLen = 2400;
    const ct = crypto
        .createHmac('sha256', secret)
        .update(`recovery-ct:${username}`)
        .digest()
        .toString('base64')
        .repeat(40)
        .slice(0, ctLen);
    const envelope = JSON.stringify({
        v: 2,
        kdf: 'PBKDF2-SHA256',
        iter: 600_000,
        iv: fakeIv,
        ct,
    });
    const recoveryVault = Buffer.from(envelope, 'utf-8').toString('base64');
    const recoverySalt = seed.subarray(12, 28).toString('base64');
    return { recoveryVault, recoverySalt };
}

// ─── Password reset via recovery key ─────────────────────────────────────

interface ResetPasswordInput {
    username: string;
    recoveryDigest: string;          // sha256(normalized_mnemonic), base64
    newPassword: string;
    newEncryptedVault: string;       // privateKeyJwk re-encrypted under new password
    newVaultSalt: string;
    newEncryptedRecoveryKey: string; // mnemonic re-encrypted under new password+salt
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}> {
    const ip = await getClientIp();
    {
        // Per-IP: noisy attackers. 10/hr is generous for legit users (who'd
        // realistically hit this 1-2 times in their lifetime).
        const { allowed } = rateLimit(`reset-ip:${ip}`, 10, 60 * 60 * 1000);
        if (!allowed) return { ok: false, error: 'Too many reset attempts. Please try again later.' };
    }

    const {
        username,
        recoveryDigest,
        newPassword,
        newEncryptedVault,
        newVaultSalt,
        newEncryptedRecoveryKey,
    } = input;

    if (
        typeof username !== 'string' || username.length < 3 || username.length > 100 ||
        typeof recoveryDigest !== 'string' || recoveryDigest.length < 40 || recoveryDigest.length > 100 ||
        typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 200 ||
        typeof newEncryptedVault !== 'string' || newEncryptedVault.length === 0 || newEncryptedVault.length > 50_000 ||
        typeof newVaultSalt !== 'string' || newVaultSalt.length === 0 || newVaultSalt.length > 200 ||
        typeof newEncryptedRecoveryKey !== 'string' || newEncryptedRecoveryKey.length === 0 || newEncryptedRecoveryKey.length > 5_000
    ) {
        return { ok: false, error: 'Invalid input.' };
    }

    {
        // Per-username: slow an attacker who knows a username and is guessing
        // mnemonics (infeasible anyway at 256 bits, but defense in depth).
        const { allowed } = rateLimit(`reset:${username}`, 5, 60 * 60 * 1000);
        if (!allowed) return { ok: false, error: 'Too many reset attempts for this account.' };
    }

    const { data: user } = await supabaseAdmin
        .from('Users')
        .select('id, recovery_hash')
        .eq('username', username)
        .single();

    // Constant-time-ish: do a bcrypt compare against a placeholder if no user,
    // so timing doesn't reveal username existence to the attacker.
    const dummyHash = '$2b$12$' + 'A'.repeat(53);
    const hashToCheck = user?.recovery_hash || dummyHash;
    const matches = await bcrypt.compare(recoveryDigest, hashToCheck);

    if (!user || !matches) {
        return { ok: false, error: 'Invalid recovery key for that username.' };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    const { error } = await supabaseAdmin
        .from('Users')
        .update({
            password_hash: newPasswordHash,
            encrypted_vault: newEncryptedVault,
            vault_salt: newVaultSalt,
            encrypted_recovery_key: newEncryptedRecoveryKey,
        })
        .eq('id', user.id);

    if (error) {
        logError('resetPasswordAction: update failed', error);
        return { ok: false, error: 'Could not complete reset. Please try again.' };
    }

    return { ok: true };
}

// ─── Recovery material in settings ────────────────────────────────────────

/**
 * Returns everything the client needs to reveal the current recovery key:
 * the password-wrapped blob and the vault salt to derive the same KEK from
 * the password the user just typed.
 */
export async function getRecoveryRevealMaterialAction(): Promise<
    | { ok: true; encryptedRecoveryKey: string; vaultSalt: string }
    | { ok: false; error: string }
> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Not authenticated' };

    const { data, error } = await supabaseAdmin
        .from('Users')
        .select('encrypted_recovery_key, vault_salt')
        .eq('id', session.user.id)
        .single();

    if (error || !data) return { ok: false, error: 'Could not load recovery material.' };
    if (!data.encrypted_recovery_key || !data.vault_salt) {
        return { ok: false, error: 'Recovery key not set up.' };
    }
    return {
        ok: true,
        encryptedRecoveryKey: data.encrypted_recovery_key,
        vaultSalt: data.vault_salt,
    };
}

/**
 * Used for both initial setup (existing users adding recovery) and rotation
 * (replacing an existing recovery key with a new one). In either case the
 * server simply overwrites the four recovery columns with client-provided
 * values — the client has already done the crypto.
 */
export async function setRecoveryMaterialAction(input: {
    recoveryVault: string;
    recoverySalt: string;
    recoveryDigest: string;
    encryptedRecoveryKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Not authenticated' };

    {
        const { allowed } = rateLimit(`set-recovery:${session.user.id}`, 10, 60 * 60 * 1000);
        if (!allowed) return { ok: false, error: 'Too many recovery updates. Please wait and try again.' };
    }

    const { recoveryVault, recoverySalt, recoveryDigest, encryptedRecoveryKey } = input;
    if (
        typeof recoveryVault !== 'string' || recoveryVault.length === 0 || recoveryVault.length > 50_000 ||
        typeof recoverySalt !== 'string' || recoverySalt.length === 0 || recoverySalt.length > 200 ||
        typeof recoveryDigest !== 'string' || recoveryDigest.length < 40 || recoveryDigest.length > 100 ||
        typeof encryptedRecoveryKey !== 'string' || encryptedRecoveryKey.length === 0 || encryptedRecoveryKey.length > 5_000
    ) {
        return { ok: false, error: 'Invalid input.' };
    }

    const recoveryHash = await bcrypt.hash(recoveryDigest, BCRYPT_COST);

    const { error } = await supabaseAdmin
        .from('Users')
        .update({
            recovery_vault: recoveryVault,
            recovery_salt: recoverySalt,
            recovery_hash: recoveryHash,
            encrypted_recovery_key: encryptedRecoveryKey,
        })
        .eq('id', session.user.id);

    if (error) {
        logError('setRecoveryMaterialAction: update failed', error);
        return { ok: false, error: 'Could not save recovery material.' };
    }
    return { ok: true };
}
