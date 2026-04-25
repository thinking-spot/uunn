// --- Domain Types ---

export interface Union {
    id: string;
    name: string;
    // Only present for admins; members do not receive the raw invite code.
    inviteCode?: string;
    encryptionKey: string;
    role: string;
    location?: string;
    description?: string;
    isPublic?: boolean;
    members: string[];
}

export interface MessageData {
    id: string;
    ciphertext: string;
    iv: string;
    senderId: string;
    senderName: string;
    createdAt: { seconds: number };
    isOptimistic?: boolean;
}

export interface DecryptedMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: { seconds: number };
    isOptimistic?: boolean;
}

export type ChannelType = "union" | "alliance";

export interface Channel {
    type: ChannelType;
    id: string;
    name: string;
    encryptedKey: string;
    subtitle?: string;
}

export interface VoteData {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'closed';
    vote_type: 'yes_no' | 'multiple_choice';
    created_at: string;
    created_by: string;
    created_by_name?: string;
    my_vote?: string;
    attached_documents?: { id: string; title: string }[];
    results: {
        yes: number;
        no: number;
        abstain: number;
        total: number;
    };
}

/**
 * A single VoteResponse row as returned by the server. After migration 0011
 * (C1), `choice` is null for new responses; the encrypted choice lives in
 * `choice_blob` + `iv` and is decrypted client-side with the union key.
 * Legacy rows carry `choice` populated and the blob/iv null.
 */
export interface VoteResponseRaw {
    user_id: string;
    choice: string | null;
    choice_blob: string | null;
    iv: string | null;
}

/**
 * Server-side raw vote payload — same metadata as VoteData, but with raw
 * encrypted responses instead of an aggregated tally. The client decrypts
 * + tallies via getDecryptedUnionVotes (see client-actions/votes.ts).
 */
export interface VoteRawData {
    id: string;
    union_id: string;
    title: string;
    title_blob?: string | null;
    title_iv?: string | null;
    description: string;
    description_blob?: string | null;
    description_iv?: string | null;
    status: 'open' | 'closed';
    vote_type: 'yes_no' | 'multiple_choice';
    created_at: string;
    created_by: string;
    created_by_name: string;
    attached_documents: VoteAttachedDocument[];
    responses: VoteResponseRaw[];
}

/**
 * Attached document as returned by the server with the encrypted vote payload.
 * The title is decrypted client-side using the union key.
 */
export interface VoteAttachedDocument {
    id: string;
    title: string;
    title_blob?: string | null;
    title_iv?: string | null;
    union_id?: string;
}

export interface Document {
    id: string;
    // Plaintext placeholder for legacy rows / server-side display.
    // For new (post-H4) rows, the real title is in title_blob/title_iv.
    title: string;
    title_blob?: string | null;
    title_iv?: string | null;
    content_blob: string;
    iv: string;
    union_id: string;
    updated_at: string;
}

export interface DecryptedDocument {
    id: string;
    title: string;
    content: string;
    union_id: string;
    updated_at: string;
}
