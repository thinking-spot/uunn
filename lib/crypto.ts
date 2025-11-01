/**
 * End-to-End Encryption Utilities
 *
 * This module provides cryptographic functions for secure worker coordination.
 * All encryption happens client-side using the Web Crypto API.
 *
 * Key features:
 * - RSA-OAEP for asymmetric encryption (key exchange)
 * - AES-GCM for symmetric encryption (message content)
 * - PBKDF2 for key derivation from passwords
 * - Secure random generation for IDs and invite codes
 */

// Type definitions
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface SerializedKeyPair {
  publicKey: string;  // Base64 encoded
  privateKey: string; // Base64 encoded
}

export interface EncryptedMessage {
  ciphertext: string;      // Base64 encoded
  iv: string;              // Base64 encoded initialization vector
  recipientPublicKey: string; // Base64 encoded
  senderPublicKey: string;    // Base64 encoded
  timestamp: number;
}

// Utility: Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility: Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a secure RSA key pair for asymmetric encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  return keyPair;
}

/**
 * Export key pair to serializable format (for storage)
 */
export async function exportKeyPair(keyPair: KeyPair): Promise<SerializedKeyPair> {
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer),
  };
}

/**
 * Import key pair from serialized format
 */
export async function importKeyPair(serialized: SerializedKeyPair): Promise<KeyPair> {
  const publicKey = await crypto.subtle.importKey(
    'spki',
    base64ToArrayBuffer(serialized.publicKey),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    base64ToArrayBuffer(serialized.privateKey),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );

  return { publicKey, privateKey };
}

/**
 * Import a public key from Base64 string
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'spki',
    base64ToArrayBuffer(publicKeyBase64),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Generate a symmetric AES key for encrypting message content
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptSymmetric(
  key: CryptoKey,
  data: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptSymmetric(
  key: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64ToArrayBuffer(iv),
    },
    key,
    base64ToArrayBuffer(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a message for a recipient using their public key
 *
 * Process:
 * 1. Generate a random AES key
 * 2. Encrypt the message with the AES key
 * 3. Encrypt the AES key with the recipient's public key
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey,
  senderPublicKeyBase64: string
): Promise<EncryptedMessage> {
  // Generate symmetric key for this message
  const symmetricKey = await generateSymmetricKey();

  // Encrypt the message with the symmetric key
  const { ciphertext, iv } = await encryptSymmetric(symmetricKey, message);

  // Export the symmetric key
  const exportedKey = await crypto.subtle.exportKey('raw', symmetricKey);

  // Encrypt the symmetric key with recipient's public key
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    exportedKey
  );

  // For group messages, we'd encrypt the same symmetric key for each recipient
  // For now, we store the encrypted key alongside the ciphertext
  const recipientPublicKeyBuffer = await crypto.subtle.exportKey('spki', recipientPublicKey);

  return {
    ciphertext: `${arrayBufferToBase64(encryptedKey)}:${ciphertext}`,
    iv,
    recipientPublicKey: arrayBufferToBase64(recipientPublicKeyBuffer),
    senderPublicKey: senderPublicKeyBase64,
    timestamp: Date.now(),
  };
}

/**
 * Decrypt a message using the recipient's private key
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  recipientPrivateKey: CryptoKey
): Promise<string> {
  // Split the encrypted key and ciphertext
  const [encryptedKeyBase64, ciphertext] = encryptedMessage.ciphertext.split(':');

  // Decrypt the symmetric key using the recipient's private key
  const symmetricKeyBuffer = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPrivateKey,
    base64ToArrayBuffer(encryptedKeyBase64)
  );

  // Import the symmetric key
  const symmetricKey = await crypto.subtle.importKey(
    'raw',
    symmetricKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );

  // Decrypt the message
  return await decryptSymmetric(symmetricKey, ciphertext, encryptedMessage.iv);
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array.buffer)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Generate a secure invite code (human-readable)
 */
export function generateInviteCode(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to alphanumeric
  let code = '';
  for (let i = 0; i < array.length; i++) {
    const char = array[i] % 36;
    code += char < 10 ? char.toString() : String.fromCharCode(87 + char);
  }

  // Format as XXXX-XXXX-XXXX-XXXX
  return `${code.substring(0, 4)}-${code.substring(4, 8)}-${code.substring(8, 12)}-${code.substring(12, 16)}`.toUpperCase();
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Generate a pseudonym (deterministic from seed, but anonymous)
 */
export async function generatePseudonym(seed?: string): Promise<string> {
  const adjectives = [
    'Brave', 'Swift', 'Wise', 'Bold', 'Fair', 'Just', 'Strong', 'United',
    'Steadfast', 'Resolute', 'Diligent', 'Fierce', 'Noble', 'Proud', 'Humble'
  ];

  const nouns = [
    'Worker', 'Builder', 'Organizer', 'Ally', 'Advocate', 'Collective',
    'Union', 'Member', 'Partner', 'Colleague', 'Comrade', 'Solidarity'
  ];

  let randomSource: Uint8Array;

  if (seed) {
    const hash = await hashData(seed);
    const buffer = base64ToArrayBuffer(hash);
    randomSource = new Uint8Array(buffer);
  } else {
    randomSource = crypto.getRandomValues(new Uint8Array(4));
  }

  const adjectiveIndex = randomSource[0] % adjectives.length;
  const nounIndex = randomSource[1] % nouns.length;
  const number = (randomSource[2] << 8) | randomSource[3];

  return `${adjectives[adjectiveIndex]}${nouns[nounIndex]}${number % 1000}`;
}
