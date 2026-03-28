import { z } from 'zod';

// --- Shared Schemas ---

export const uuid = z.string().uuid("Invalid ID format");

export const encryptedPayload = z.string().max(500_000, "Payload too large"); // ~500KB max

export const iv = z.string().max(100, "IV too large");

export const title = z.string().min(1, "Title is required").max(500, "Title too long");

export const description = z.string().max(5_000, "Description too long");

export const username = z.string().min(3, "Username too short").max(50, "Username too long");

export const inviteCode = z.string().min(1).max(100);

export const messageContent = z.object({
    unionId: uuid,
    contentBlob: encryptedPayload,
    iv: iv,
    id: uuid.optional(),
});

export const allianceMessageContent = z.object({
    allianceId: uuid,
    contentBlob: encryptedPayload,
    iv: iv,
    id: uuid.optional(),
});

export const createVoteInput = z.object({
    unionId: uuid,
    title: title,
    description: description,
    documentIds: z.array(uuid).max(20, "Too many attachments").default([]),
});

export const createDocumentInput = z.object({
    unionId: uuid,
    title: title,
    contentBlob: encryptedPayload.default(''),
    iv: iv.default(''),
});

export const updateDocumentInput = z.object({
    docId: uuid,
    contentBlob: encryptedPayload,
    iv: iv,
});

export const unionSettingsInput = z.object({
    unionId: uuid,
    settings: z.object({
        location: z.string().max(200, "Location too long").optional(),
        description: z.string().max(2_000, "Description too long").optional(),
        is_public: z.boolean().optional(),
    }),
});

/**
 * Validate input and return either parsed data or an error string.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
    const result = schema.safeParse(data);
    if (!result.success) {
        return { error: result.error.issues[0]?.message || "Invalid input" };
    }
    return { data: result.data };
}
