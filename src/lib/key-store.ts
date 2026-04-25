"use client";

/**
 * In-memory cache for the user's cryptographic keys.
 *
 * Keys live in module-scope variables only — never in sessionStorage,
 * localStorage, or IndexedDB. This means:
 *
 *   - A page refresh or new tab loses the key. Users will be prompted to
 *     unlock (re-enter password to derive the vault) before E2E features
 *     work again.
 *   - XSS in another script can't read a JWK from storage. The cached
 *     CryptoKey is also non-extractable (see importPrivateKey in crypto.ts),
 *     so even with arbitrary script execution an attacker cannot exfiltrate
 *     the raw private key — they can only invoke decrypt operations on it
 *     while their script is running.
 *
 * Trade-off: convenience (refresh keeps you decrypted) is sacrificed for
 * a much smaller blast radius on the most damaging XSS-class attacks.
 */

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;
let publicKeyJwk: JsonWebKey | null = null;

export function setPrivateKey(k: CryptoKey): void {
    privateKey = k;
}

export function getPrivateKey(): CryptoKey | null {
    return privateKey;
}

export function setPublicKey(k: CryptoKey, jwk?: JsonWebKey): void {
    publicKey = k;
    if (jwk) publicKeyJwk = jwk;
}

export function getPublicKey(): CryptoKey | null {
    return publicKey;
}

export function getPublicKeyJwk(): JsonWebKey | null {
    return publicKeyJwk;
}

export function hasPrivateKey(): boolean {
    return privateKey !== null;
}

export function clearKeys(): void {
    privateKey = null;
    publicKey = null;
    publicKeyJwk = null;
}

/**
 * Specific error thrown by getMyPrivateKey when no key is loaded. UI code
 * should catch this and trigger the unlock flow rather than treating it
 * as a generic failure.
 */
export class KeyNotLoadedError extends Error {
    constructor() {
        super("KEY_NOT_LOADED");
        this.name = "KeyNotLoadedError";
    }
}
