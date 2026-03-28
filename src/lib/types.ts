// --- Domain Types ---

export interface Union {
    id: string;
    name: string;
    inviteCode: string;
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
    my_vote?: string;
    attached_documents?: { id: string; title: string }[];
    results: {
        yes: number;
        no: number;
        abstain: number;
        total: number;
    };
}

export interface Document {
    id: string;
    title: string;
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
