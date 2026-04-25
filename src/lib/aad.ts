/**
 * Canonical AAD (Associated Data) strings for AES-GCM authenticated
 * encryption. Binding row identity in AAD prevents a server-side adversary
 * from moving ciphertext between rows of the same union (which would
 * otherwise decrypt successfully because they share the same union key).
 *
 * Keep these formats stable: any change in formatting silently breaks
 * decryption of existing rows. Add new variants instead of editing.
 */

export const aadFor = {
    message: (unionId: string, messageId: string) => `message:${unionId}:${messageId}`,
    allianceMessage: (allianceId: string, messageId: string) => `alliance-message:${allianceId}:${messageId}`,
    document: (unionId: string, documentId: string) => `document:${unionId}:${documentId}`,
    documentTitle: (unionId: string, documentId: string) => `document-title:${unionId}:${documentId}`,
    voteResponse: (voteId: string, userId: string) => `vote-response:${voteId}:${userId}`,
    voteTitle: (unionId: string, voteId: string) => `vote-title:${unionId}:${voteId}`,
    voteDescription: (unionId: string, voteId: string) => `vote-description:${unionId}:${voteId}`,
};
