'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

export type Document = {
    id: string;
    title: string;
    content: string;
    updated_at: string;
};

export async function createDocumentAction(unionId: string, title: string, content: string = '') {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    console.log("Creating document:", { unionId, userId: session.user.id, title });

    const { data, error } = await supabaseAdmin
        .from('Documents')
        .insert({
            union_id: unionId,
            created_by: session.user.id,
            title,
            content
        })
        .select()
        .single();

    if (error) {
        console.error("Create Document Error:", error);
        return { error: `Failed to create document: ${error.message}` };
    }
    return { success: true, document: data };
}

export async function getUnionDocumentsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

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

    const { data: document, error } = await supabaseAdmin
        .from('Documents')
        .select('*')
        .eq('id', docId)
        .single();

    if (error) return { error: "Document not found" };

    return { document };
}

export async function updateDocumentAction(docId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { error } = await supabaseAdmin
        .from('Documents')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', docId);

    if (error) {
        console.error("Update Document Error:", error);
        return { error: "Failed to save document" };
    }

    return { success: true };
}
