import {
    createDocumentAction,
    updateDocumentAction,
    getDocumentAction,
    getUnionDocumentsAction,
} from "@/lib/document-actions";
import type { Document } from "@/lib/types";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { getUnionKey } from "@/lib/client-crypto";
import type { DecryptedDocument } from "@/lib/types";

export type { DecryptedDocument };

export async function createEncryptedDocument(
    unionId: string,
    title: string,
    content: string,
    encryptedSharedKey: string
): Promise<{ document?: { id: string }; error?: string }> {
    if (!content) {
        return createDocumentAction(unionId, title, '', '');
    }

    const unionKey = await getUnionKey(encryptedSharedKey);
    const { cipherText, iv } = await encryptContent(content, unionKey);
    return createDocumentAction(unionId, title, cipherText, iv);
}

export async function updateEncryptedDocument(
    docId: string,
    content: string,
    encryptedSharedKey: string
): Promise<{ success?: boolean; error?: string }> {
    const unionKey = await getUnionKey(encryptedSharedKey);
    const { cipherText, iv } = await encryptContent(content, unionKey);
    return updateDocumentAction(docId, cipherText, iv);
}

export async function getDecryptedDocument(
    docId: string,
    encryptedSharedKey: string
): Promise<{ document?: DecryptedDocument; error?: string }> {
    const result = await getDocumentAction(docId);
    if (result.error || !result.document) return { error: result.error || "Document not found" };

    const doc = result.document;
    if (!doc.content_blob || !doc.iv) {
        return { document: { id: doc.id, title: doc.title, content: '', union_id: doc.union_id, updated_at: doc.updated_at } };
    }

    try {
        const unionKey = await getUnionKey(encryptedSharedKey);
        const content = await decryptContent(doc.content_blob, doc.iv, unionKey);
        return { document: { id: doc.id, title: doc.title, content, union_id: doc.union_id, updated_at: doc.updated_at } };
    } catch {
        return { document: { id: doc.id, title: doc.title, content: '[Unable to decrypt]', union_id: doc.union_id, updated_at: doc.updated_at } };
    }
}

export async function getDecryptedUnionDocuments(
    unionId: string,
    encryptedSharedKey: string
): Promise<DecryptedDocument[]> {
    const result = await getUnionDocumentsAction(unionId);
    if (result.error || !result.documents) return [];

    let unionKey: CryptoKey | null = null;
    try {
        unionKey = await getUnionKey(encryptedSharedKey);
    } catch {
        return result.documents.map((doc: Document) => ({
            id: doc.id, title: doc.title, content: '[Encrypted]', union_id: doc.union_id, updated_at: doc.updated_at
        }));
    }

    return Promise.all(
        result.documents.map(async (doc: Document) => {
            if (!doc.content_blob || !doc.iv) {
                return { id: doc.id, title: doc.title, content: '', union_id: doc.union_id, updated_at: doc.updated_at };
            }
            try {
                const content = await decryptContent(doc.content_blob, doc.iv, unionKey!);
                return { id: doc.id, title: doc.title, content, union_id: doc.union_id, updated_at: doc.updated_at };
            } catch {
                return { id: doc.id, title: doc.title, content: '[Unable to decrypt]', union_id: doc.union_id, updated_at: doc.updated_at };
            }
        })
    );
}
