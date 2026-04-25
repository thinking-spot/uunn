import { castVoteAction, createVoteAction, getUnionVotesAction } from "@/lib/vote-actions";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { aadFor } from "@/lib/aad";
import { getUnionKey } from "@/lib/client-crypto";
import type { VoteData, VoteRawData } from "@/lib/types";

const VOTE_TITLE_PLACEHOLDER = 'Encrypted Vote';

/**
 * Create a vote with title + description encrypted client-side (H4). The
 * server only sees opaque ciphertext for these fields plus a generic
 * placeholder in the legacy `title`/`description` columns.
 */
export async function createEncryptedVote(
    unionId: string,
    title: string,
    description: string,
    documentIds: string[],
    encryptedSharedKey: string,
): Promise<{ vote?: { id: string }; error?: string }> {
    const id = crypto.randomUUID();
    let unionKey: CryptoKey;
    try {
        unionKey = await getUnionKey(encryptedSharedKey);
    } catch {
        return { error: "Could not derive union key — please unlock and retry." };
    }

    const titleEnc = await encryptContent(title, unionKey, aadFor.voteTitle(unionId, id));
    const descEnc = description
        ? await encryptContent(description, unionKey, aadFor.voteDescription(unionId, id))
        : { cipherText: '', iv: '' };

    const result = await createVoteAction(
        unionId,
        VOTE_TITLE_PLACEHOLDER,
        '', // legacy description placeholder
        documentIds,
        id,
        titleEnc.cipherText,
        titleEnc.iv,
        description ? descEnc.cipherText : undefined,
        description ? descEnc.iv : undefined,
    );

    if (result.error) return { error: result.error };
    return { vote: result.vote };
}

/**
 * Encrypt a vote choice with the union AES-GCM key and submit it.
 *
 * The plaintext "yes" / "no" / "abstain" never reaches the server; the
 * server only sees the ciphertext and IV. Members aggregate tallies
 * locally via getDecryptedUnionVotes.
 */
export async function castEncryptedVote(
    voteId: string,
    choice: 'yes' | 'no' | 'abstain',
    encryptedSharedKey: string,
    userId: string,
): Promise<{ error?: string; success?: boolean }> {
    let unionKey: CryptoKey;
    try {
        unionKey = await getUnionKey(encryptedSharedKey);
    } catch {
        return { error: "Could not derive union key — please unlock and retry." };
    }
    const { cipherText, iv } = await encryptContent(choice, unionKey, aadFor.voteResponse(voteId, userId));
    return castVoteAction(voteId, cipherText, iv);
}

/**
 * Fetch all votes for a union and decrypt their choice ciphertexts locally,
 * computing the tally + the caller's own vote on the client. The server
 * never sees the plaintext mapping of who-voted-what.
 *
 * Legacy plaintext responses (created before C1's migration 0011) are
 * counted as-is so historical tallies remain visible.
 *
 * Decryption failures (e.g. union key was rotated since the vote was cast)
 * are counted under `total` but not added to any specific bucket — they
 * appear as "encrypted (key unavailable)" in the total but don't bias any
 * outcome.
 */
export async function getDecryptedUnionVotes(
    unionId: string,
    encryptedSharedKey: string,
    myUserId: string,
): Promise<{ votes?: VoteData[]; error?: string }> {
    const result = await getUnionVotesAction(unionId);
    if (result.error || !result.votes) return { error: result.error || "Failed to load votes" };

    let unionKey: CryptoKey | null = null;
    try {
        unionKey = await getUnionKey(encryptedSharedKey);
    } catch {
        unionKey = null; // Tally still possible from legacy plaintext rows.
    }

    const votes = await Promise.all(
        result.votes.map(async (raw: VoteRawData) => {
            const counts = { yes: 0, no: 0, abstain: 0, total: 0 };
            let myVote: string | undefined;

            // Decrypt title/description from blob if present (H4), else fall
            // back to the plaintext column for legacy rows.
            let title = raw.title;
            let description = raw.description;
            if (unionKey && raw.title_blob && raw.title_iv) {
                try {
                    title = await decryptContent(raw.title_blob, raw.title_iv, unionKey, aadFor.voteTitle(raw.union_id, raw.id));
                } catch { /* keep placeholder */ }
            }
            if (unionKey && raw.description_blob && raw.description_iv) {
                try {
                    description = await decryptContent(raw.description_blob, raw.description_iv, unionKey, aadFor.voteDescription(raw.union_id, raw.id));
                } catch { /* keep placeholder */ }
            }

            // Decrypt attached document titles too — they may be encrypted (H4).
            const attached_documents = await Promise.all((raw.attached_documents || []).map(async (d) => {
                let docTitle = d.title;
                if (unionKey && d.title_blob && d.title_iv && d.union_id) {
                    try {
                        docTitle = await decryptContent(d.title_blob, d.title_iv, unionKey, aadFor.documentTitle(d.union_id, d.id));
                    } catch { /* keep placeholder */ }
                }
                return { id: d.id, title: docTitle };
            }));

            for (const r of raw.responses) {
                let decoded: string | null = null;
                if (r.choice_blob && r.iv && unionKey) {
                    try {
                        decoded = await decryptContent(
                            r.choice_blob,
                            r.iv,
                            unionKey,
                            aadFor.voteResponse(raw.id, r.user_id),
                        );
                    } catch {
                        decoded = null; // Counted in total only.
                    }
                } else if (r.choice) {
                    // Legacy plaintext row — pre-C1.
                    decoded = r.choice;
                }

                counts.total++;
                if (decoded === 'yes') counts.yes++;
                else if (decoded === 'no') counts.no++;
                else if (decoded === 'abstain') counts.abstain++;

                if (r.user_id === myUserId && decoded) myVote = decoded;
            }

            return {
                id: raw.id,
                title,
                description,
                status: raw.status,
                vote_type: raw.vote_type,
                created_at: raw.created_at,
                created_by: raw.created_by,
                created_by_name: raw.created_by_name,
                attached_documents,
                my_vote: myVote,
                results: counts,
            } satisfies VoteData;
        }),
    );

    return { votes };
}
