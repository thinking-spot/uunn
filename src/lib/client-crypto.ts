import { importPrivateKey, unwrapKey } from '@/lib/crypto';
import { STORAGE_KEYS } from '@/lib/constants';

/**
 * Get the current user's private key from session storage.
 */
export function getMyPrivateKey(): Promise<CryptoKey> {
    const jwkStr = sessionStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    if (!jwkStr) return Promise.reject("No private key found");
    return importPrivateKey(JSON.parse(jwkStr));
}

/**
 * Unwrap a union/alliance shared key using the current user's private key.
 */
export async function getUnionKey(encryptedSharedKey: string): Promise<CryptoKey> {
    const privateKey = await getMyPrivateKey();
    return unwrapKey(encryptedSharedKey, privateKey);
}
