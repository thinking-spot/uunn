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
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
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
// Encrypts text/data with the Union Key.
export async function encryptContent(content: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    return {
        cipherText: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
}

// 5. Content Decryption (AES-GCM)
export async function decryptContent(cipherText: string, iv: string, key: CryptoKey): Promise<string> {
    const data = base64ToArrayBuffer(cipherText);
    const ivBuffer = base64ToArrayBuffer(iv);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBuffer,
        },
        key,
        data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
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
