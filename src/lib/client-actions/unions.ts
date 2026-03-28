import {
    createUnionAction,
    joinUnionAction,
    getUserUnionsAction,
    getMyPublicKeyAction,
    createInviteAction,
    getInviteAction,
    setInviteKeyAction,
    getInviteKeyAction,
    requestAllianceAction as requestAllianceServer,
    getAlliedUnionsAction as getAlliedUnionsServer,
    rotateUnionKeyAction,
    getUnionMemberPublicKeysAction,
    deleteMemberAction
} from "@/lib/union-actions";
import { generateUnionKey, exportKey, wrapKey, importPublicKey, importPrivateKey, unwrapKey, generateUserKeyPair, encryptKeyWithCode, decryptKeyWithCode } from "@/lib/crypto";
import { getMyPrivateKey } from "@/lib/client-crypto";
import { Union } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Retroactively stores the invite-code-encrypted union key for an existing union.
 * Call this as an admin when the union was created before the escrow feature existed.
 */
export async function refreshInviteKey(unionId: string): Promise<void> {
    const unions = await getUserUnionsAction();
    const myMembership = unions.find((u: any) => u.id === unionId);
    if (!myMembership) throw new Error("You are not a member of this union");
    if (!myMembership.encryptionKey) throw new Error("No encryption key found");

    const myPrivateKey = await getMyPrivateKey();
    const unionKey = await unwrapKey(myMembership.encryptionKey, myPrivateKey);

    const inviteCode = myMembership.inviteCode;
    if (!inviteCode) throw new Error("No invite code found");

    const { blob, salt } = await encryptKeyWithCode(unionKey, inviteCode);
    const result = await setInviteKeyAction(unionId, blob, salt);
    if (result.error) throw new Error(result.error);
}

export type { Union };

/**
 * Creates a new union with end-to-end encryption.
 * Generates a union key, encrypts it with creator's public key, and stores it.
 */
export async function createUnion(name: string, createdBy: string, location?: string, description?: string): Promise<string> {
    // 1. Generate AES-GCM Key for Union
    const unionKey = await generateUnionKey();

    // 2. Get My Public Key
    // Try sessionStorage first
    let pubKeyJwkStr = sessionStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
    let pubKeyJwk;

    if (pubKeyJwkStr) {
        pubKeyJwk = JSON.parse(pubKeyJwkStr);
    } else {
        // Fallback: Fetch from server
        const response = await getMyPublicKeyAction();
        if (response.error || !response.publicKey) {
            throw new Error("Public key not found. Please log out and back in, or check your connection.");
        }
        pubKeyJwk = JSON.parse(response.publicKey);
        // Save for next time
        sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, response.publicKey);
    }

    const myPublicKey = await importPublicKey(pubKeyJwk);

    // 3. Wrap Key
    const wrappedKey = await wrapKey(unionKey, myPublicKey);

    // 4. Call Server Action
    const result = await createUnionAction(name, wrappedKey, location, description);

    if (result.error) throw new Error(result.error);

    // 5. Encrypt union key with invite code for future joiners
    try {
        const { blob, salt } = await encryptKeyWithCode(unionKey, result.inviteCode!);
        await setInviteKeyAction(result.unionId!, blob, salt);
    } catch (e) {
        console.warn("Failed to store invite key escrow:", e);
    }

    return result.unionId!;
}

/**
 * Joins a union using an invite code.
 * Decrypts the union key from the invite-code escrow and re-wraps it with the user's public key.
 */
export async function joinUnion(inviteCode: string, userId: string): Promise<string> {
    // 1. Try to get the invite-code-encrypted union key
    let encryptedSharedKey: string | undefined;
    try {
        const keyData = await getInviteKeyAction(inviteCode);
        if (!keyData.error && keyData.inviteKeyBlob && keyData.inviteKeySalt) {
            // 2. Decrypt union key using invite code
            const unionKey = await decryptKeyWithCode(keyData.inviteKeyBlob, keyData.inviteKeySalt, inviteCode);

            // 3. Re-wrap with the joining user's public key
            let pubKeyJwkStr = sessionStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
            if (!pubKeyJwkStr) {
                const response = await getMyPublicKeyAction();
                if (response.publicKey) {
                    pubKeyJwkStr = response.publicKey;
                    sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, response.publicKey);
                }
            }
            if (pubKeyJwkStr) {
                const myPublicKey = await importPublicKey(JSON.parse(pubKeyJwkStr));
                encryptedSharedKey = await wrapKey(unionKey, myPublicKey);
            }
        }
    } catch (e) {
        console.warn("Could not obtain union key from invite code:", e);
    }

    // 4. Join the union (with or without the key)
    const result = await joinUnionAction(inviteCode, encryptedSharedKey);
    if (result.error) throw new Error(result.error);
    return result.unionId!;
}

export async function getUserUnions(userId?: string): Promise<Union[]> {
    try {
        const unions = await getUserUnionsAction();
        return unions as Union[];
    } catch (e) {
        return [];
    }
}

export async function getUnion(unionId: string): Promise<Union | null> {
    // We don't have a direct getUnion action yet, but we can reuse getUserUnions or add one.
    // For now, let's filter from getUserUnions (inefficient but works for small scale)
    const unions = await getUserUnionsAction();
    return (unions.find((u: any) => u.id === unionId) as Union) || null;
}

// Alliance functions - stubbed for now
// Alliance functions
export async function requestAlliance(fromUnionId: string, toUnionId: string) {
    const result = await requestAllianceServer(fromUnionId, toUnionId);
    if (result.error) throw new Error(result.error);
    return result;
}

export async function getAlliedUnions(unionId: string): Promise<Union[]> {
    const result = await getAlliedUnionsServer(unionId);
    if (result.error) throw new Error(result.error);
    return result.allies as Union[];
}

/**
 * Creates a Secure Invite Link that grants access to union history.
 * Encrypts the Union Key with a temporary "Visit Key".
 */
export async function createSecureInvite(unionId: string): Promise<string> {
    // 1. Get the UNWRAPPED union key (we need to fetch it first?)
    // In our current app flow, we don't store the raw key in memory persistently.
    // We usually unwrap it when needed.
    // So we need to fetch our own membership, get the encrypted key, decrypt it with our private key.

    // FETCH OWN MEMBERSHIP (Optimization: Should pass key in if we have it)
    const unions = await getUserUnionsAction();
    const myMembership = unions.find((u: any) => u.id === unionId);
    if (!myMembership) throw new Error("You are not a member of this union");

    const myPrivateKey = await getMyPrivateKey();
    const unionKey = await unwrapKey(myMembership.encryptionKey, myPrivateKey);

    // 2. Generate Ephemeral Key Pair for the Invite
    const visitKeyPair = await generateUserKeyPair();
    const visitPublicKeyJwk = await exportKey(visitKeyPair.publicKey);
    const visitPrivateKeyJwk = await exportKey(visitKeyPair.privateKey);

    // 3. Encrypt Union Key with Visit Public Key
    const encryptedUnionKey = await wrapKey(unionKey, visitKeyPair.publicKey);

    // 4. Send to Server (Public Key + Encrypted Blob)
    const result = await createInviteAction(
        unionId,
        encryptedUnionKey,
        JSON.stringify(visitPublicKeyJwk),
        "server-inferred" // Placeholder, server should ignore or Verify.
    );

    if (result.error) throw new Error(result.error);

    // 5. Construct URL
    // Format: https://uunn.io/invite/<inviteId>#<privateKeyBase64>
    const fragment = window.btoa(JSON.stringify(visitPrivateKeyJwk));
    return `${window.location.origin}/invite/${result.inviteId}#${fragment}`;
}

/**
 * Removes a member and rotates the union encryption key.
 * This ensures the removed member cannot decrypt future messages.
 */
export async function removeMemberAndRotateKey(unionId: string, memberId: string): Promise<void> {
    // 1. Remove the member first
    const deleteResult = await deleteMemberAction(unionId, memberId);
    if (deleteResult.error) throw new Error(deleteResult.error);

    // 2. Generate a new union key
    const newUnionKey = await generateUnionKey();

    // 3. Get remaining members' public keys
    const keysResult = await getUnionMemberPublicKeysAction(unionId);
    if (keysResult.error || !keysResult.members) throw new Error(keysResult.error || "Failed to fetch member keys");

    // 4. Wrap the new key for each remaining member
    const wrappedKeys: { userId: string; encryptedSharedKey: string }[] = [];
    for (const member of keysResult.members) {
        if (!member.publicKey) continue;
        try {
            const pubKey = await importPublicKey(JSON.parse(member.publicKey));
            const wrapped = await wrapKey(newUnionKey, pubKey);
            wrappedKeys.push({ userId: member.userId, encryptedSharedKey: wrapped });
        } catch {
            // Skip members with invalid keys
        }
    }

    // 5. Push rotated keys to server
    const rotateResult = await rotateUnionKeyAction(unionId, wrappedKeys);
    if (rotateResult.error) throw new Error(rotateResult.error);
}

/**
 * Joins a union via a Secure Invite Link.
 * Decrypts the Union Key using the ephemeral key in the URL.
 */
export async function joinSecureInvite(inviteId: string, visitPrivateKeyJwkStr: string): Promise<string> {
    // 1. Fetch Invite Data
    const inviteData = await getInviteAction(inviteId);
    if (inviteData.error) throw new Error(inviteData.error);

    // 2. Import Visit Private Key
    const visitPrivateKey = await importPrivateKey(JSON.parse(visitPrivateKeyJwkStr));

    // 3. Decrypt Union Key
    const unionKey = await unwrapKey(inviteData.encryptedUnionKey, visitPrivateKey);

    // 4. Re-Encrypt for ME (My Public Key)
    // Need my public key.
    const myPubKeyStr = sessionStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
    if (!myPubKeyStr) throw new Error("Public key not found");
    const myPublicKey = await importPublicKey(JSON.parse(myPubKeyStr));

    const myEncryptedKey = await wrapKey(unionKey, myPublicKey);

    // 5. Join
    const result = await joinUnionAction(inviteId, myEncryptedKey);
    if (result.error) {
        throw new Error(result.error);
    }

    if (result.alreadyMember) {
        return result.unionId!;
    }

    return result.unionId!;
}
