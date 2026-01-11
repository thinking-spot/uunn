'use client';

// Refactored to use Server Actions instead of Firebase directly

export interface Union {
    id: string;
    name: string;
    inviteCode: string;
    encryptionKey: string;
    role: string;
    members: string[]; // Or User[] objects
}
import { createUnionAction, joinUnionAction, getUserUnionsAction, getMyPublicKeyAction } from "@/lib/union-actions";
import { generateUnionKey, exportKey, wrapKey, importPublicKey, importPrivateKey, unwrapKey } from "@/lib/crypto";

export type { Union };

// Helper to get my private key from storage
function getMyPrivateKey(): Promise<CryptoKey> {
    const jwkStr = localStorage.getItem('uunn_private_key');
    if (!jwkStr) return Promise.reject("No private key found");
    return importPrivateKey(JSON.parse(jwkStr));
}

// Helper to get my public key (regenerate from private? or store public too?)
// Actually we need to encrypt the Union Key for OURSELVES.
// We can use our public key if we have it, OR just encrypt it symmetrically with our password?
// architecture.md said: "Union shared key is encrypted with each member's public key"
// So for Creator, we encrypt it with Creator's Public Key.
// Where is Creator's Public Key?
// We sent it to server, but we also have it locally if we stored it?
// Let's assume we stored it or can derive it.
// Actually, `crypto.ts` `generateUserKeyPair` returned both.
// In `login/page.tsx`, we stored `uunn_private_key`. We did NOT store public key locally.
// But we can derive the public key from the private key? No, not easily with Web Crypto export.
// ERROR in logic: We should have stored Public Key locally too for convenience, OR fetch it from Server (User profile).
//
// WORKAROUND: For now, I will fetch my own user profile (which has public key) to get my public key.
// But we don't have a "getUser" API yet.
//
// ALTERNATIVE: Since I am the creator, I have the RAW Union Key right now.
// I can just "Wrap" it using my Public Key.
// I need my Public Key.
// I will temporarily store Public Key in localStorage in `login/page.tsx` as well?
//
// OR: I can just Fetch "Me" from server actions?
//
// Let's assume for this step I will implement a quick `getMe` action or just fetch public key from valid sources.
//
// SIMPLIFICATION:
// I will update Login/Register to store Public Key in localStorage too. simple.

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

export async function joinUnion(inviteCode: string, userId: string): Promise<string> {
    const result = await joinUnionAction(inviteCode);
    if (result.error) throw new Error(result.error);
    return result.unionId!;
}

export async function getUserUnions(userId: string): Promise<Union[]> {
    return (await getUserUnionsAction()) as Union[];
}

export async function getUnion(unionId: string): Promise<Union | null> {
    // We don't have a direct getUnion action yet, but we can reuse getUserUnions or add one.
    // For now, let's filter from getUserUnions (inefficient but works for small scale)
    const unions = await getUserUnionsAction();
    return (unions.find((u: any) => u.id === unionId) as Union) || null;
}

// Alliance functions - stubbed for now
export async function requestAlliance(unionId: string, targetInviteCode: string) {
    console.log("Alliance request not implemented yet");
}

export async function approveAlliance(unionId: string, targetUnionId: string) {
    console.log("Alliance approve not implemented yet");
}

export async function getAlliedUnions(unionId: string): Promise<Union[]> {
    return [];
}
