'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validate, createDocumentInput, updateDocumentInput, uuid } from '@/lib/validation';
import { verifyMembership } from '@/lib/auth-helpers';
import type { Document } from '@/lib/types';

export async function createDocumentAction(unionId: string, title: string, contentBlob: string = '', iv: string = '') {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const v = validate(createDocumentInput, { unionId, title, contentBlob, iv });
    if ('error' in v) return { error: v.error };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data, error } = await supabaseAdmin
        .from('Documents')
        .insert({
            union_id: unionId,
            created_by: session.user.id,
            title,
            content_blob: contentBlob,
            iv
        })
        .select()
        .single();

    if (error) {
        console.error("Document insert error:", error);
        return { error: "Failed to create document" };
    }
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

export async function updateDocumentAction(docId: string, contentBlob: string, iv: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const v = validate(updateDocumentInput, { docId, contentBlob, iv });
    if ('error' in v) return { error: v.error };

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
