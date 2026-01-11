'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

export async function sendMessageAction(
    unionId: string,
    contentBlob: string,
    iv: string
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        const { error } = await supabase
            .from('Messages')
            .insert({
                union_id: unionId,
                sender_id: session.user.id,
                content_blob: contentBlob,
                iv: iv
            });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Failed to send message:", error);
        return { error: `Failed to send message: ${error.message || JSON.stringify(error)}` };
    }
}

export async function getMessagesAction(unionId: string, limit = 50) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const { data, error } = await supabase
        .from('Messages')
        .select(`
            id,
            content_blob,
            iv,
            sender_id,
            created_at,
            sender:Users (
                username
            )
        `)
        .eq('union_id', unionId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error || !data) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return data.map((m: any) => ({
        id: m.id,
        ciphertext: m.content_blob,
        iv: m.iv,
        senderId: m.sender_id,
        senderName: m.sender.username,
        createdAt: m.created_at
    }));
}
