'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validate, updateDocumentInput, uuid, encryptedPayload, iv as ivSchema } from '@/lib/validation';
import { verifyMembership } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { recordActivity } from '@/lib/activity';
import type { Document } from '@/lib/types';
import { logError } from '@/lib/log';

// Placeholder written into the legacy NOT NULL `title` column. The real
// title is always in title_blob/title_iv; this string is just there to
// satisfy the schema until the column is made nullable.
const DOC_TITLE_PLACEHOLDER = 'Encrypted Document';

export async function createDocumentAction(
    unionId: string,
    titleBlob: string,
    titleIv: string,
    contentBlob: string = '',
    iv: string = '',
    id?: string,
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const uV = validate(uuid, unionId);
    if ('error' in uV) return { error: uV.error };
    const tbV = validate(encryptedPayload, titleBlob);
    if ('error' in tbV) return { error: tbV.error };
    const tivV = validate(ivSchema, titleIv);
    if ('error' in tivV) return { error: tivV.error };
    const cbV = validate(encryptedPayload, contentBlob);
    if ('error' in cbV) return { error: cbV.error };
    const civV = validate(ivSchema, iv);
    if ('error' in civV) return { error: civV.error };
    if (id !== undefined) {
        const idV = validate(uuid, id);
        if ('error' in idV) return { error: idV.error };
    }

    const { allowed } = rateLimit(`doc-create:${session.user.id}`, 20, 60_000);
    if (!allowed) return { error: "Slow down — too many documents created in the last minute." };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const insertRow: Record<string, unknown> = {
        union_id: unionId,
        created_by: session.user.id,
        title: DOC_TITLE_PLACEHOLDER,
        content_blob: contentBlob,
        iv,
        title_blob: titleBlob,
        title_iv: titleIv,
    };
    if (id) insertRow.id = id;

    const { data, error } = await supabaseAdmin
        .from('Documents')
        .insert(insertRow)
        .select()
        .single();

    if (error) {
        logError('createDocument failed', error);
        return { error: "Failed to create document" };
    }
    await recordActivity({
        unionId,
        actorId: session.user.id,
        kind: 'document_created',
        targetId: data.id,
        targetLabel: null, // title is encrypted; members decrypt on click-through
    });
    return { success: true, document: data };
}

export async function getUnionDocumentsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const uv = validate(uuid, unionId);
    if ('error' in uv) return { error: uv.error };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data: documents, error } = await supabaseAdmin
        .from('Documents')
        .select('*')
        .eq('union_id', unionId)
        .order('updated_at', { ascending: false });

    if (error) return { error: "Failed to fetch documents" };

    return { documents };
}

export async function getDocumentAction(docId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const dv = validate(uuid, docId);
    if ('error' in dv) return { error: dv.error };

    const { data: document, error } = await supabaseAdmin
        .from('Documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (error || !document) return { error: "Document not found" };

    // Verify caller is member of the document's union
    if (!await verifyMembership(document.union_id, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    return { document };
}

export async function generateDocumentDraftAction(
    templateType: string,
    data: {
        title: string;
        date: string;
        narrative: string;
        solution: string;
        voteThreshold: string;
        voteDate: string;
        memberMessage: string;
        unionName?: string;
    }
): Promise<{ draft?: string; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        return { error: "Gemini API Key is not configured" };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are an expert union organizer and legal aide. Draft a formal "${templateType}" document based on the following details:

    Title: ${data.title}
    Date: ${data.date}
    Union Name: ${data.unionName || "[Union Name]"}

    Context/Narrative:
    ${data.narrative}

    Desired Solution/Demand:
    ${data.solution}

    Vote Threshold: ${data.voteThreshold}
    Proposed Vote Date: ${data.voteDate}
    Message to Members: ${data.memberMessage}

    Instructions:
    - Format the output as a professional, formal document suitable for the specific template type.
    - Use clear, strong, and legally sound language (where applicable, but do not provide legal advice).
    - If it's a letter, include standard header/footer placeholders.
    - If it's a petition, include a section for signatures.
    - Return ONLY the document content, no conversational filler.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { draft: response.text() };
    } catch {
        return { error: "Failed to generate document" };
    }
}

export async function formalizeDocumentAction(markdownContent: string): Promise<{ draft?: string; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
        return { error: "Gemini API Key is not configured" };
    }

    if (!markdownContent.trim()) {
        return { error: "Document content is empty" };
    }

    const { FORMALIZE_PROMPT } = await import('@/lib/document-templates');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent(FORMALIZE_PROMPT + markdownContent);
        const response = result.response;
        const text = response.text();
        if (!text) {
            logError('formalize: empty Gemini response');
            return { error: "Gemini returned an empty response — the content may have been blocked by safety filters." };
        }
        return { draft: text };
    } catch (err) {
        logError('formalize: Gemini call failed', err);
        return { error: "Failed to formalize document" };
    }
}

export async function updateDocumentAction(docId: string, contentBlob: string, iv: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const v = validate(updateDocumentInput, { docId, contentBlob, iv });
    if ('error' in v) return { error: v.error };

    // Cap autosaves at ~2/sec sustained. Generous, but stops a stuck save loop
    // or hostile script from hammering the DB.
    const { allowed } = rateLimit(`doc-update:${session.user.id}`, 120, 60_000);
    if (!allowed) return { error: "Slow down — too many save attempts in the last minute." };

    // Fetch document to get its union_id for authorization
    const { data: doc } = await supabaseAdmin
        .from('Documents')
        .select('union_id')
        .eq('id', docId)
        .single();

    if (!doc) return { error: "Document not found" };

    if (!await verifyMembership(doc.union_id, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { error } = await supabaseAdmin
        .from('Documents')
        .update({ content_blob: contentBlob, iv, updated_at: new Date().toISOString() })
        .eq('id', docId);

    if (error) {
        return { error: "Failed to save document" };
    }

    return { success: true };
}
