// Client-side Cryptography Utilities using Web Crypto API

// 1. Key Generation (RSA-OAEP for Key Exchange)
// Each user has a Key Pair. Public key is on server, Private key is local.
export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

// 2. Key Export/Import (JWK format for storage/transmission)
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
    return window.crypto.subtle.exportKey("jwk", key);
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    // Public keys never need to be re-exported once imported.
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        false,
        ["encrypt"]
    );
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    // Private keys are only used for `decrypt`/unwrap. Marking the imported
    // CryptoKey non-extractable means script context cannot exportKey() the
    // raw private key — defense-in-depth against XSS exfiltration. The vault
    // (encrypted at rest) remains the only persisted form of this key.
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        false,
        ["decrypt"]
    );
}

// 3. Shared Key Generation (AES-GCM for Content Encryption)
// Each Union has one Shared Key.
export async function generateUnionKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Helper to Import Shared Key
export async function importSharedKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// 4. Content Encryption (AES-GCM)
//
// `aad` is optional Associated Data: bytes that are NOT encrypted but ARE
// authenticated. Binding row identity (e.g. "message:<unionId>:<msgId>") in
// AAD prevents a server-side adversary from "shuffling" ciphertext between
// rows of the same union — moving a message between conversations or
// replaying an old document blob into a new document row would fail
// authentication during decryption.
export async function encryptContent(
    content: string,
    key: CryptoKey,
    aad?: string,
): Promise<{ cipherText: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const params: AesGcmParams = {
        name: "AES-GCM",
        iv: iv as BufferSource,
    };
    if (aad !== undefined) {
        params.additionalData = encoder.encode(aad) as BufferSource;
    }

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        params,
        key,
        data,
    );

    return {
        cipherText: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
}

// 5. Content Decryption (AES-GCM)
//
// If `aad` is provided, decryption first attempts with AAD bound; on auth
// failure it retries without AAD. This lets new ciphertext (written with
// AAD) and legacy ciphertext (written without AAD before H3) both round-trip
// transparently. Once enough time has passed for legacy rows to be migrated,
// the fallback can be removed and AAD enforced strictly.
export async function decryptContent(
    cipherText: string,
    iv: string,
    key: CryptoKey,
    aad?: string,
): Promise<string> {
    const data = base64ToArrayBuffer(cipherText);
    const ivBuffer = base64ToArrayBuffer(iv);
    const encoder = new TextEncoder();

    const baseParams: AesGcmParams = {
        name: "AES-GCM",
        iv: ivBuffer as BufferSource,
    };

    if (aad !== undefined) {
        try {
            const buf = await window.crypto.subtle.decrypt(
                { ...baseParams, additionalData: encoder.encode(aad) as BufferSource },
                key,
                data,
            );
            return new TextDecoder().decode(buf);
        } catch {
            // Fall through to legacy (no-AAD) decrypt for backward compat.
        }
    }

    const buf = await window.crypto.subtle.decrypt(baseParams, key, data);
    return new TextDecoder().decode(buf);
}

// 6. Key Wrapping (RSA-OAEP)
// Encrypt the "Union Shared Key" with a User's "Public Key" so only they can read it.
export async function wrapKey(keyToWrap: CryptoKey, wrappingKey: CryptoKey): Promise<string> {
    // Export the key to raw bits first
    const rawKey = await window.crypto.subtle.exportKey("raw", keyToWrap);

    const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        wrappingKey,
        rawKey
    );

    return arrayBufferToBase64(encryptedKeyBuffer);
}

// 7. Key Unwrapping (RSA-OAEP)
// Decrypt the "Union Shared Key" using the User's "Private Key".
export async function unwrapKey(wrappedKey: string, unwrappingPrivateKey: CryptoKey): Promise<CryptoKey> {
    const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);

    const rawKeyBuffer = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        unwrappingPrivateKey,
        wrappedKeyBuffer
    );

    return window.crypto.subtle.importKey(
        "raw",
        rawKeyBuffer,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Utilities
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// 8. Key Vault (Backup & Recovery)
// Encrypts the Private Key using the User's Password.

// Vault format versions
//
// v1 (legacy): Vault is base64(iv || ciphertext). Salt stored separately
//              in `vault_salt`. PBKDF2 100,000 iterations, SHA-256.
//
// v2 (current): Vault is base64(JSON envelope) with explicit version,
//               KDF, and iteration count. Salt continues to be stored in
//               `vault_salt` for schema compatibility. PBKDF2 600,000
//               iterations (OWASP 2023+ minimum for SHA-256).
//
// On read, decryptVault auto-detects the format and uses appropriate params.
// On write, encryptVault always emits v2.

const VAULT_VERSION = 2 as const;
const PBKDF2_ITER_V1 = 100_000;
const PBKDF2_ITER_V2 = 600_000;

interface VaultEnvelopeV2 {
    v: 2;
    kdf: 'PBKDF2-SHA256';
    iter: number;
    iv: string;
    ct: string;
}

// Derive a strong encryption key from the user's password using PBKDF2
async function deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations: number = PBKDF2_ITER_V2,
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptVault(privateKeyJwk: JsonWebKey, password: string): Promise<{ vault: string; salt: string }> {
    // 1. Generate random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    // 2. Derive Key (v2 iteration count)
    const wrappingKey = await deriveKeyFromPassword(password, salt, PBKDF2_ITER_V2);

    // 3. Encrypt the JWK string
    const jwkString = JSON.stringify(privateKeyJwk);
    const encoder = new TextEncoder();
    const data = encoder.encode(jwkString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        wrappingKey,
        data
    );

    // 4. Emit v2 envelope: base64-encoded JSON with version + KDF params.
    const envelope: VaultEnvelopeV2 = {
        v: VAULT_VERSION,
        kdf: 'PBKDF2-SHA256',
        iter: PBKDF2_ITER_V2,
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
        ct: arrayBufferToBase64(encryptedContent),
    };

    return {
        vault: window.btoa(JSON.stringify(envelope)),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    };
}

/**
 * Identify the vault format. Returns 'v1' for legacy raw `iv||ct` blobs,
 * 'v2' for JSON envelopes. Used by login flow to decide whether to lazily
 * re-encrypt the vault to the latest format.
 */
export function getVaultVersion(vaultBase64: string): 1 | 2 {
    try {
        const decoded = window.atob(vaultBase64);
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.v === 2) return 2;
    } catch {
        // not JSON → legacy v1
    }
    return 1;
}

// 9. Invite Code Key Escrow
// Encrypts/decrypts the union AES key using a key derived from the invite code.
// This allows users who join via invite code to obtain the union key.

export async function encryptKeyWithCode(
    keyToEncrypt: CryptoKey,
    inviteCode: string
): Promise<{ blob: string; salt: string }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await deriveKeyFromPassword(inviteCode, salt);
    const rawKey = await window.crypto.subtle.exportKey("raw", keyToEncrypt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        derivedKey,
        rawKey
    );

    const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.byteLength);

    return {
        blob: arrayBufferToBase64(combined.buffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    };
}

export async function decryptKeyWithCode(
    blob: string,
    salt: string,
    inviteCode: string
): Promise<CryptoKey> {
    const saltBytes = new Uint8Array(base64ToArrayBuffer(salt));
    const combined = new Uint8Array(base64ToArrayBuffer(blob));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const derivedKey = await deriveKeyFromPassword(inviteCode, saltBytes);

    const rawKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        derivedKey,
        data
    );

    return window.crypto.subtle.importKey(
        "raw",
        rawKeyBuffer,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function decryptVault(vaultBase64: string, password: string, saltBase64: string): Promise<JsonWebKey> {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

    // Try v2 envelope first.
    let iv: Uint8Array;
    let ciphertext: Uint8Array;
    let iterations: number;

    let envelope: VaultEnvelopeV2 | null = null;
    try {
        const decoded = window.atob(vaultBase64);
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.v === 2 && typeof parsed.iter === 'number') {
            envelope = parsed as VaultEnvelopeV2;
        }
    } catch {
        // Fall through to v1.
    }

    if (envelope) {
        iv = new Uint8Array(base64ToArrayBuffer(envelope.iv));
        ciphertext = new Uint8Array(base64ToArrayBuffer(envelope.ct));
        iterations = envelope.iter;
    } else {
        // Legacy v1: vault is base64(iv(12) || ciphertext), 100k iterations.
        const combined = new Uint8Array(base64ToArrayBuffer(vaultBase64));
        iv = combined.slice(0, 12);
        ciphertext = combined.slice(12);
        iterations = PBKDF2_ITER_V1;
    }

    const unwrappingKey = await deriveKeyFromPassword(password, salt, iterations);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv as BufferSource },
            unwrappingKey,
            ciphertext as BufferSource
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedBuffer));
    } catch {
        throw new Error("Invalid password or corrupted vault");
    }
}
