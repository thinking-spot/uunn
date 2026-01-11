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

// 8. Key Vault (Backup & Recovery)
// Encrypts the Private Key using the User's Password.

// Derive a strong encryption key from the user's password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
            salt: salt,
            iterations: 100000,
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

    // 2. Derive Key
    const wrappingKey = await deriveKeyFromPassword(password, salt);

    // 3. Encrypt the JWK string
    const jwkString = JSON.stringify(privateKeyJwk);
    const encoder = new TextEncoder();
    const data = encoder.encode(jwkString);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        wrappingKey,
        data
    );

    // 4. Pack Salt + IV + Ciphertext
    // Format: salt(16) + iv(12) + ciphertext
    // Actually, easier to return Salt separate, and pack IV with content.
    // Let's pack IV with Ciphertext like typically done: IV + Cipher => Base64

    const combinedBuffer = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
    combinedBuffer.set(iv, 0);
    combinedBuffer.set(new Uint8Array(encryptedContent), iv.byteLength);

    return {
        vault: arrayBufferToBase64(combinedBuffer.buffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer)
    };
}

export async function decryptVault(vaultBase64: string, password: string, saltBase64: string): Promise<JsonWebKey> {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const combined = new Uint8Array(base64ToArrayBuffer(vaultBase64));

    // Extract IV (12 bytes)
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const unwrappingKey = await deriveKeyFromPassword(password, salt);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            unwrappingKey,
            data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (e) {
        throw new Error("Invalid password or corrupted vault");
    }
}
