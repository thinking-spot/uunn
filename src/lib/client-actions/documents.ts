import {
    createDocumentAction,
    updateDocumentAction,
    getDocumentAction,
    getUnionDocumentsAction,
} from "@/lib/document-actions";
import type { Document } from "@/lib/types";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { aadFor } from "@/lib/aad";
import { getUnionKey } from "@/lib/client-crypto";
import type { DecryptedDocument } from "@/lib/types";

export type { DecryptedDocument };

// Plaintext placeholder stored in the visible `title` column for new rows.
// Hidden behind the encrypted title for any client that has the union key.
const TITLE_PLACEHOLDER = 'Encrypted Document';

export async function createEncryptedDocument(
    unionId: string,
    title: string,
    content: string,
    encryptedSharedKey: string,
): Promise<{ document?: { id: string }; error?: string }> {
    // Client-generated UUID lets us bind row identity into AES-GCM AAD (H3)
    // before sending — preventing a server-side adversary from "moving" this
    // ciphertext to a different document row. Same id is used for the
    // title's AAD (H4).
    const id = crypto.randomUUID();
    const unionKey = await getUnionKey(encryptedSharedKey);

    // Encrypt title (H4). Always encrypted, even for empty-content docs.
    const titleEncrypted = await encryptContent(title, unionKey, aadFor.documentTitle(unionId, id));

    if (!content) {
        return createDocumentAction(
            unionId, TITLE_PLACEHOLDER, '', '', id,
            titleEncrypted.cipherText, titleEncrypted.iv,
        );
    }

    const { cipherText, iv } = await encryptContent(content, unionKey, aadFor.document(unionId, id));
    return createDocumentAction(
        unionId, TITLE_PLACEHOLDER, cipherText, iv, id,
        titleEncrypted.cipherText, titleEncrypted.iv,
    );
}

export async function updateEncryptedDocument(
    docId: string,
    content: string,
    encryptedSharedKey: string,
    unionId: string,
): Promise<{ success?: boolean; error?: string }> {
    const unionKey = await getUnionKey(encryptedSharedKey);
    const { cipherText, iv } = await encryptContent(content, unionKey, aadFor.document(unionId, docId));
    return updateDocumentAction(docId, cipherText, iv);
}

/**
 * Decrypt the `title_blob`/`title_iv` fields if present, otherwise fall back
 * to the plaintext `title`. Used by both the per-doc and list paths.
 */
async function resolveTitle(
    doc: Document,
    unionKey: CryptoKey | null,
): Promise<string> {
    if (!doc.title_blob || !doc.title_iv || !unionKey) return doc.title;
    try {
        return await decryptContent(
            doc.title_blob,
            doc.title_iv,
            unionKey,
            aadFor.documentTitle(doc.union_id, doc.id),
        );
    } catch {
        return doc.title;
    }
}

export async function getDecryptedDocument(
    docId: string,
    encryptedSharedKey: string,
): Promise<{ document?: DecryptedDocument; error?: string }> {
    const result = await getDocumentAction(docId);
    if (result.error || !result.document) return { error: result.error || "Document not found" };

    const doc = result.document;

    let unionKey: CryptoKey | null = null;
    try { unionKey = await getUnionKey(encryptedSharedKey); } catch { unionKey = null; }
    const title = await resolveTitle(doc, unionKey);

    if (!doc.content_blob || !doc.iv) {
        return { document: { id: doc.id, title, content: '', union_id: doc.union_id, updated_at: doc.updated_at } };
    }

    if (!unionKey) {
        return { document: { id: doc.id, title, content: '[Encrypted]', union_id: doc.union_id, updated_at: doc.updated_at } };
    }

    try {
        const content = await decryptContent(doc.content_blob, doc.iv, unionKey, aadFor.document(doc.union_id, doc.id));
        return { document: { id: doc.id, title, content, union_id: doc.union_id, updated_at: doc.updated_at } };
    } catch {
        return { document: { id: doc.id, title, content: '[Unable to decrypt]', union_id: doc.union_id, updated_at: doc.updated_at } };
    }
}

export async function getDecryptedUnionDocuments(
    unionId: string,
    encryptedSharedKey: string,
): Promise<DecryptedDocument[]> {
    const result = await getUnionDocumentsAction(unionId);
    if (result.error || !result.documents) return [];

    let unionKey: CryptoKey | null = null;
    try { unionKey = await getUnionKey(encryptedSharedKey); } catch { unionKey = null; }

    return Promise.all(
        result.documents.map(async (doc: Document) => {
            const title = await resolveTitle(doc, unionKey);

            if (!doc.content_blob || !doc.iv) {
                return { id: doc.id, title, content: '', union_id: doc.union_id, updated_at: doc.updated_at };
            }
            if (!unionKey) {
                return { id: doc.id, title, content: '[Encrypted]', union_id: doc.union_id, updated_at: doc.updated_at };
            }
            try {
                const content = await decryptContent(doc.content_blob, doc.iv, unionKey, aadFor.document(doc.union_id, doc.id));
                return { id: doc.id, title, content, union_id: doc.union_id, updated_at: doc.updated_at };
            } catch {
                return { id: doc.id, title, content: '[Unable to decrypt]', union_id: doc.union_id, updated_at: doc.updated_at };
            }
        })
    );
}
