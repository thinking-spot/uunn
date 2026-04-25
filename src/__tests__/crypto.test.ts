/**
 * Crypto module tests
 *
 * The crypto.ts module uses `window.crypto` and `window.btoa/atob`.
 * We polyfill these with Node.js built-ins so tests run without a browser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';

// Polyfill browser globals before importing the module
beforeAll(() => {
  // @ts-expect-error — Node webcrypto is compatible with browser crypto
  globalThis.window = {
    crypto: webcrypto,
    btoa: (s: string) => Buffer.from(s, 'binary').toString('base64'),
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
  };
});

// Dynamic import so polyfills are in place first
async function getCrypto() {
  return import('@/lib/crypto');
}

describe('Key Generation', () => {
  it('generates an RSA key pair', async () => {
    const { generateUserKeyPair } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP');
    expect(keyPair.privateKey.algorithm.name).toBe('RSA-OAEP');
  });

  it('generates an AES-256 union key', async () => {
    const { generateUnionKey } = await getCrypto();
    const key = await generateUnionKey();
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
  });
});

describe('Key Export/Import', () => {
  it('exports and imports a public key', async () => {
    const { generateUserKeyPair, exportKey, importPublicKey } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const jwk = await exportKey(keyPair.publicKey);
    const imported = await importPublicKey(jwk);
    expect(imported.algorithm.name).toBe('RSA-OAEP');
    expect(imported.usages).toContain('encrypt');
  });

  it('exports and imports a private key', async () => {
    const { generateUserKeyPair, exportKey, importPrivateKey } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const jwk = await exportKey(keyPair.privateKey);
    const imported = await importPrivateKey(jwk);
    expect(imported.algorithm.name).toBe('RSA-OAEP');
    expect(imported.usages).toContain('decrypt');
  });

  it('exports and imports a shared key', async () => {
    const { generateUnionKey, exportKey, importSharedKey } = await getCrypto();
    const key = await generateUnionKey();
    const jwk = await exportKey(key);
    const imported = await importSharedKey(jwk);
    expect(imported.algorithm.name).toBe('AES-GCM');
  });
});

describe('Content Encryption/Decryption', () => {
  it('encrypts and decrypts a message round-trip', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();
    const plaintext = 'Workers of the world, unite!';

    const { cipherText, iv } = await encryptContent(plaintext, key);
    expect(cipherText).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(cipherText).not.toBe(plaintext);

    const decrypted = await decryptContent(cipherText, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('handles empty string encryption', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();

    const { cipherText, iv } = await encryptContent('', key);
    const decrypted = await decryptContent(cipherText, iv, key);
    expect(decrypted).toBe('');
  });

  it('handles unicode content', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();
    const plaintext = 'Solidarity forever! Solidaridad para siempre!';

    const { cipherText, iv } = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(cipherText, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('produces unique ciphertexts for the same plaintext (unique IV)', async () => {
    const { generateUnionKey, encryptContent } = await getCrypto();
    const key = await generateUnionKey();
    const plaintext = 'same message';

    const result1 = await encryptContent(plaintext, key);
    const result2 = await encryptContent(plaintext, key);

    expect(result1.cipherText).not.toBe(result2.cipherText);
    expect(result1.iv).not.toBe(result2.iv);
  });

  it('fails to decrypt with wrong key', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key1 = await generateUnionKey();
    const key2 = await generateUnionKey();

    const { cipherText, iv } = await encryptContent('secret', key1);

    await expect(decryptContent(cipherText, iv, key2)).rejects.toThrow();
  });

  it('round-trips with AAD', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();
    const aad = 'message:union-1:msg-A';

    const { cipherText, iv } = await encryptContent('hello', key, aad);
    const text = await decryptContent(cipherText, iv, key, aad);
    expect(text).toBe('hello');
  });

  it('decrypts AAD ciphertext when expected AAD matches; falls back when missing', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();

    const legacy = await encryptContent('legacy', key); // no AAD

    // Caller passes an AAD expectation, but stored ciphertext has none.
    // Must still succeed via the legacy fallback path.
    const text = await decryptContent(legacy.cipherText, legacy.iv, key, 'message:u:m');
    expect(text).toBe('legacy');
  });

  it('rejects ciphertext when AAD differs (no false fallback)', async () => {
    const { generateUnionKey, encryptContent, decryptContent } = await getCrypto();
    const key = await generateUnionKey();

    const { cipherText, iv } = await encryptContent('x', key, 'message:u:A');

    // Wrong AAD: must fail to decrypt — cannot silently succeed under a
    // different (or no) AAD, otherwise an attacker could "move" ciphertext
    // between rows that bind different AADs.
    await expect(
      decryptContent(cipherText, iv, key, 'message:u:B')
    ).rejects.toThrow();
  });
});

describe('Key Wrapping/Unwrapping', () => {
  it('wraps and unwraps a union key with RSA key pair', async () => {
    const { generateUserKeyPair, generateUnionKey, wrapKey, unwrapKey, exportKey } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const unionKey = await generateUnionKey();

    // Wrap with public key
    const wrappedKey = await wrapKey(unionKey, keyPair.publicKey);
    expect(wrappedKey).toBeTruthy();
    expect(typeof wrappedKey).toBe('string');

    // Unwrap with private key
    const unwrappedKey = await unwrapKey(wrappedKey, keyPair.privateKey);
    expect(unwrappedKey.algorithm.name).toBe('AES-GCM');

    // Verify the unwrapped key works for encrypt/decrypt
    const { encryptContent, decryptContent } = await getCrypto();
    const { cipherText, iv } = await encryptContent('test message', unionKey);
    const decrypted = await decryptContent(cipherText, iv, unwrappedKey);
    expect(decrypted).toBe('test message');
  });

  it('fails to unwrap with wrong private key', async () => {
    const { generateUserKeyPair, generateUnionKey, wrapKey, unwrapKey } = await getCrypto();
    const keyPair1 = await generateUserKeyPair();
    const keyPair2 = await generateUserKeyPair();
    const unionKey = await generateUnionKey();

    const wrappedKey = await wrapKey(unionKey, keyPair1.publicKey);

    await expect(unwrapKey(wrappedKey, keyPair2.privateKey)).rejects.toThrow();
  });
});

describe('Vault (Key Backup/Recovery)', () => {
  it('encrypts and decrypts a vault with password', async () => {
    const { generateUserKeyPair, exportKey, encryptVault, decryptVault } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const privateKeyJwk = await exportKey(keyPair.privateKey);
    const password = 'strong-password-123';

    const { vault, salt } = await encryptVault(privateKeyJwk, password);
    expect(vault).toBeTruthy();
    expect(salt).toBeTruthy();

    const recovered = await decryptVault(vault, password, salt);
    expect(recovered.kty).toBe(privateKeyJwk.kty);
    expect(recovered.n).toBe(privateKeyJwk.n);
    expect(recovered.d).toBe(privateKeyJwk.d);
  });

  it('fails to decrypt vault with wrong password', async () => {
    const { generateUserKeyPair, exportKey, encryptVault, decryptVault } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const privateKeyJwk = await exportKey(keyPair.privateKey);

    const { vault, salt } = await encryptVault(privateKeyJwk, 'correct-password');

    await expect(decryptVault(vault, 'wrong-password', salt)).rejects.toThrow('Invalid password or corrupted vault');
  });

  it('emits a v2 envelope by default', async () => {
    const { generateUserKeyPair, exportKey, encryptVault, getVaultVersion } = await getCrypto();
    const keyPair = await generateUserKeyPair();
    const privateKeyJwk = await exportKey(keyPair.privateKey);
    const { vault } = await encryptVault(privateKeyJwk, 'pw');
    expect(getVaultVersion(vault)).toBe(2);
    // Envelope must declare the new iteration count
    const decoded = JSON.parse(globalThis.window.atob(vault));
    expect(decoded.v).toBe(2);
    expect(decoded.kdf).toBe('PBKDF2-SHA256');
    expect(decoded.iter).toBe(600_000);
  });

  it('decrypts a legacy v1 vault (raw iv||ct, 100k iterations)', async () => {
    const { generateUserKeyPair, exportKey, decryptVault, getVaultVersion } = await getCrypto();
    const { webcrypto } = await import('node:crypto');

    const keyPair = await generateUserKeyPair();
    const privateKeyJwk = await exportKey(keyPair.privateKey);

    // Hand-craft a v1 vault: PBKDF2 100k iter, AES-GCM, vault = base64(iv || ct).
    const password = 'legacy-password';
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const keyMaterial = await webcrypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey = await webcrypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const ct = new Uint8Array(await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      enc.encode(JSON.stringify(privateKeyJwk)),
    ));
    const combined = new Uint8Array(iv.length + ct.length);
    combined.set(iv, 0);
    combined.set(ct, iv.length);
    const v1Vault = Buffer.from(combined).toString('base64');
    const v1Salt = Buffer.from(salt).toString('base64');

    expect(getVaultVersion(v1Vault)).toBe(1);

    const recovered = await decryptVault(v1Vault, password, v1Salt);
    expect(recovered.kty).toBe(privateKeyJwk.kty);
    expect(recovered.d).toBe(privateKeyJwk.d);
  });
});

describe('Public Key Fingerprint (H8)', () => {
  it('produces a deterministic, key-bound fingerprint for the same JWK', async () => {
    const { generateUserKeyPair, exportKey } = await getCrypto();
    const { fingerprint } = await import('@/lib/key-fingerprint');

    const pair = await generateUserKeyPair();
    const jwk = await exportKey(pair.publicKey);

    const a = await fingerprint(jwk);
    const b = await fingerprint(jwk);
    expect(a).toBe(b);
    // Format: 16 colon-separated hex pairs.
    expect(a).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2}){15}$/);
  });

  it('produces different fingerprints for different keys', async () => {
    const { generateUserKeyPair, exportKey } = await getCrypto();
    const { fingerprint } = await import('@/lib/key-fingerprint');

    const j1 = await exportKey((await generateUserKeyPair()).publicKey);
    const j2 = await exportKey((await generateUserKeyPair()).publicKey);

    expect(await fingerprint(j1)).not.toBe(await fingerprint(j2));
  });

  it('is stable under JSON re-ordering (canonicalisation)', async () => {
    const { generateUserKeyPair, exportKey } = await getCrypto();
    const { fingerprint } = await import('@/lib/key-fingerprint');

    const original = await exportKey((await generateUserKeyPair()).publicKey);

    // Re-build the JWK with keys in a different order.
    const reordered: JsonWebKey = {};
    Object.keys(original).reverse().forEach(k => {
      (reordered as Record<string, unknown>)[k] = (original as Record<string, unknown>)[k];
    });

    expect(await fingerprint(reordered)).toBe(await fingerprint(original));
  });
});

describe('Invite Code Key Escrow', () => {
  it('encrypts and decrypts a key with invite code', async () => {
    const { generateUnionKey, encryptKeyWithCode, decryptKeyWithCode, encryptContent, decryptContent } = await getCrypto();
    const unionKey = await generateUnionKey();
    const inviteCode = 'ABC123DEF456';

    const { blob, salt } = await encryptKeyWithCode(unionKey, inviteCode);
    expect(blob).toBeTruthy();
    expect(salt).toBeTruthy();

    const recoveredKey = await decryptKeyWithCode(blob, salt, inviteCode);

    // Verify recovered key works
    const { cipherText, iv } = await encryptContent('invite test', unionKey);
    const decrypted = await decryptContent(cipherText, iv, recoveredKey);
    expect(decrypted).toBe('invite test');
  });

  it('fails with wrong invite code', async () => {
    const { generateUnionKey, encryptKeyWithCode, decryptKeyWithCode } = await getCrypto();
    const unionKey = await generateUnionKey();

    const { blob, salt } = await encryptKeyWithCode(unionKey, 'correct-code');

    await expect(decryptKeyWithCode(blob, salt, 'wrong-code')).rejects.toThrow();
  });
});
