import {
    setAllianceKeysAction,
    getMyAllianceKeyAction,
    getAllianceMembersAction,
    sendAllianceMessageAction,
    getAllianceMessagesAction,
    getMyAlliancesAction
} from "@/lib/alliance-actions";
import {
    generateUnionKey,
    wrapKey,
    unwrapKey,
    importPublicKey,
    encryptContent,
    decryptContent
} from "@/lib/crypto";
import { getMyPrivateKey } from "@/lib/client-crypto";

/**
 * Called when an alliance is accepted.
 * Generates a shared AES-GCM key for the alliance,
 * wraps it for every member of both unions, and stores the wrapped keys.
 */
export async function distributeAllianceKeys(allianceId: string) {
    // 1. Generate a new AES-GCM shared key for this alliance
    const allianceKey = await generateUnionKey();

    // 2. Fetch all members of both unions (with their public keys)
    const result = await getAllianceMembersAction(allianceId);
    if ('error' in result) throw new Error(result.error);

    const members = result.members!;

    // 3. Wrap the alliance key with each member's public key (skip members without keys)
    const wrappedKeys: { userId: string; encryptedSharedKey: string }[] = [];
    for (const member of members) {
        if (!member.publicKey) continue; // Skip legacy members without keys
        try {
            const pubKey = await importPublicKey(JSON.parse(member.publicKey));
            const encryptedSharedKey = await wrapKey(allianceKey, pubKey);
            wrappedKeys.push({ userId: member.userId, encryptedSharedKey });
        } catch {
            // Skip members with invalid keys
        }
    }

    if (wrappedKeys.length === 0) {
        throw new Error("No members with valid public keys found");
    }

    // 4. Store all wrapped keys
    const storeResult = await setAllianceKeysAction(allianceId, wrappedKeys);
    if (storeResult.error) throw new Error(storeResult.error);

    return { success: true };
}

/**
 * Get the unwrapped alliance key for the current user.
 */
export async function getAllianceKey(allianceId: string): Promise<CryptoKey> {
    const result = await getMyAllianceKeyAction(allianceId);
    if ('error' in result) throw new Error(result.error);

    const privateKey = await getMyPrivateKey();
    return unwrapKey(result.encryptedSharedKey!, privateKey);
}

/**
 * Send an encrypted message to an alliance channel.
 */
export async function sendEncryptedAllianceMessage(
    allianceId: string,
    plaintext: string,
    allianceKey: CryptoKey
) {
    const { cipherText, iv } = await encryptContent(plaintext, allianceKey);
    const id = crypto.randomUUID();
    const result = await sendAllianceMessageAction(allianceId, cipherText, iv, id);
    if (result.error) throw new Error(result.error);
    return { id, cipherText, iv };
}

/**
 * Fetch and decrypt alliance messages.
 */
export async function getDecryptedAllianceMessages(
    allianceId: string,
    allianceKey: CryptoKey,
    limit = 50
) {
    const result = await getAllianceMessagesAction(allianceId, limit);
    const messages = result.messages;

    return Promise.all(
        messages.map(async (m) => {
            try {
                const text = await decryptContent(m.ciphertext, m.iv, allianceKey);
                return { ...m, text };
            } catch {
                return { ...m, text: "[Unable to decrypt]" };
            }
        })
    );
}

export { getMyAlliancesAction } from "@/lib/alliance-actions";
