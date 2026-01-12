import {
    createUnionAction,
    joinUnionAction,
    getUserUnionsAction,
    getMyPublicKeyAction,
    createInviteAction,
    getInviteAction,
    requestAllianceAction as requestAllianceServer,
    getAlliedUnionsAction as getAlliedUnionsServer
} from "@/lib/union-actions";
import { generateUnionKey, exportKey, wrapKey, importPublicKey, importPrivateKey, unwrapKey, generateUserKeyPair } from "@/lib/crypto";

export interface Union {
    id: string;
    name: string;
    inviteCode: string;
    encryptionKey: string;
    role: string;
    location?: string;
    description?: string;
    isPublic?: boolean;
    members: string[]; // Or User[] objects
}

// Helper to get my private key from storage
function getMyPrivateKey(): Promise<CryptoKey> {
    const jwkStr = localStorage.getItem('uunn_private_key');
    if (!jwkStr) return Promise.reject("No private key found");
    return importPrivateKey(JSON.parse(jwkStr));
}

/**
 * Creates a new union with end-to-end encryption.
 * Generates a union key, encrypts it with creator's public key, and stores it.
 */
export async function createUnion(name: string, createdBy: string): Promise<string> {
    // 1. Generate AES-GCM Key for Union
    const unionKey = await generateUnionKey();

    // 2. Get My Public Key
    // Try localStorage first
    let pubKeyJwkStr = localStorage.getItem('uunn_public_key');
    let pubKeyJwk;

    if (pubKeyJwkStr) {
        pubKeyJwk = JSON.parse(pubKeyJwkStr);
    } else {
        // Fallback: Fetch from server
        console.log("Public key not in local storage, fetching from server...");
        const response = await getMyPublicKeyAction();
        if (response.error || !response.publicKey) {
            throw new Error("Public key not found. Please log out and back in, or check your connection.");
        }
        pubKeyJwk = JSON.parse(response.publicKey);
        // Save for next time
        localStorage.setItem('uunn_public_key', response.publicKey);
    }

    const myPublicKey = await importPublicKey(pubKeyJwk);

    // 3. Wrap Key
    const wrappedKey = await wrapKey(unionKey, myPublicKey);

    // 4. Call Server Action
    const result = await createUnionAction(name, wrappedKey);

    if (result.error) throw new Error(result.error);
    return result.unionId!;
}

/**
 * Joins a union using a legacy unencrypted invite code.
 * (Note: This user will NOT have access to history until key is shared)
 */
export async function joinUnion(inviteCode: string, userId: string): Promise<string> {
    const result = await joinUnionAction(inviteCode);
    if (result.error) throw new Error(result.error);
    return result.unionId!;
}

export async function getUserUnions(userId?: string): Promise<Union[]> {
    try {
        const unions = await getUserUnionsAction();
        return unions as Union[];
    } catch (e) {
        console.error("Failed to fetch unions", e);
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
    const myPubKeyStr = localStorage.getItem('uunn_public_key');
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
