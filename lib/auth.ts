/**
 * Authentication and Identity Management
 *
 * Handles pseudonymous identity creation, key management,
 * and session handling. All done client-side.
 */

import {
  generateKeyPair,
  exportKeyPair,
  importKeyPair,
  generateSecureId,
  generatePseudonym,
} from './crypto';
import { saveUser, getUser, deleteUser } from './storage';
import type { LocalUserData, UserIdentity } from '@/types';

/**
 * Create a new pseudonymous identity
 */
export async function createIdentity(
  customPseudonym?: string
): Promise<LocalUserData> {
  // Generate encryption keys
  const keyPair = await generateKeyPair();
  const serializedKeys = await exportKeyPair(keyPair);

  // Generate pseudonym
  const pseudonym = customPseudonym || (await generatePseudonym());

  // Create identity
  const identity: LocalUserData = {
    id: generateSecureId(),
    pseudonym,
    publicKey: serializedKeys.publicKey,
    privateKey: serializedKeys.privateKey,
    createdAt: Date.now(),
    groups: [],
  };

  // Save locally
  await saveUser(identity);

  return identity;
}

/**
 * Get current user identity
 */
export async function getCurrentUser(): Promise<LocalUserData | null> {
  const user = await getUser();
  return user || null;
}

/**
 * Check if user is authenticated (has identity)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user;
}

/**
 * Get user's public identity (safe to share)
 */
export async function getPublicIdentity(): Promise<UserIdentity | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    id: user.id,
    pseudonym: user.pseudonym,
    publicKey: user.publicKey,
    createdAt: user.createdAt,
  };
}

/**
 * Update user's pseudonym
 */
export async function updatePseudonym(newPseudonym: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  user.pseudonym = newPseudonym;
  await saveUser(user);
}

/**
 * Add a group to user's group list
 */
export async function addUserGroup(groupId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  if (!user.groups.includes(groupId)) {
    user.groups.push(groupId);
    await saveUser(user);
  }
}

/**
 * Remove a group from user's group list
 */
export async function removeUserGroup(groupId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  user.groups = user.groups.filter((id) => id !== groupId);
  await saveUser(user);
}

/**
 * Logout (delete local identity and data)
 */
export async function logout(): Promise<void> {
  await deleteUser();
}

/**
 * Verify encryption keys are valid
 */
export async function verifyKeys(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Try to import the keys
    await importKeyPair({
      publicKey: user.publicKey,
      privateKey: user.privateKey,
    });

    return true;
  } catch (error) {
    console.error('Key verification failed:', error);
    return false;
  }
}

/**
 * Regenerate keys (in case of compromise)
 */
export async function regenerateKeys(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  const keyPair = await generateKeyPair();
  const serializedKeys = await exportKeyPair(keyPair);

  user.publicKey = serializedKeys.publicKey;
  user.privateKey = serializedKeys.privateKey;

  await saveUser(user);
}

/**
 * Get user's private key for decryption
 */
export async function getPrivateKey(): Promise<CryptoKey> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  const keyPair = await importKeyPair({
    publicKey: user.publicKey,
    privateKey: user.privateKey,
  });

  return keyPair.privateKey;
}

/**
 * Get user's public key for encryption
 */
export async function getPublicKey(): Promise<CryptoKey> {
  const user = await getCurrentUser();
  if (!user) throw new Error('No user found');

  const keyPair = await importKeyPair({
    publicKey: user.publicKey,
    privateKey: user.privateKey,
  });

  return keyPair.publicKey;
}

/**
 * Session token for API authentication
 * (Ephemeral, not stored server-side)
 */
export function generateSessionToken(): string {
  return generateSecureId(64);
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return token.length === 64 && /^[A-Za-z0-9_-]+$/.test(token);
}
