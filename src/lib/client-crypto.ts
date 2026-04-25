import { unwrapKey } from '@/lib/crypto';
import { getPrivateKey, KeyNotLoadedError } from '@/lib/key-store';

/**
 * Get the current user's private key from the in-memory key store.
 *
 * Throws KeyNotLoadedError if no key is loaded. UI code must catch this and
 * show the unlock prompt rather than treating it as a generic failure —
 * this is the expected state after a page refresh / new tab when the
 * NextAuth session is still valid but the locally-derived key has not been
 * re-derived from the user's password yet.
 */
export function getMyPrivateKey(): Promise<CryptoKey> {
    const key = getPrivateKey();
    if (!key) return Promise.reject(new KeyNotLoadedError());
    return Promise.resolve(key);
}

/**
 * Unwrap a union/alliance shared key using the current user's private key.
 */
export async function getUnionKey(encryptedSharedKey: string): Promise<CryptoKey> {
    const privateKey = await getMyPrivateKey();
    return unwrapKey(encryptedSharedKey, privateKey);
}
