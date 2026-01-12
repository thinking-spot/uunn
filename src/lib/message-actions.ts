'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { notifyUnionMembersAction } from '@/lib/push-actions';

export async function sendMessageAction(
    unionId: string,
    contentBlob: string,
    iv: string,
    id?: string // Optional client-generated ID
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        const payload: any = {
            union_id: unionId,
            sender_id: session.user.id,
            content_blob: contentBlob,
            iv: iv
        };
        if (id) payload.id = id;

        const { error } = await supabaseAdmin
            .from('Messages')
            .insert(payload);

        if (error) throw error;

        // Trigger Notification (Async, don't block heavily? Actually safer to await or fire-and-forget logic)
        // We'll await it to ensure it runs before serverless function spins down, but catch errors.
        try {
            await notifyUnionMembersAction(unionId, session.user.id, {
                title: 'New Message',
                body: 'You have a new encrypted message.',
                url: `/messages`
            });
        } catch (pushError) {
            console.warn("Failed to trigger push notifications:", pushError);
            // Don't fail the message send
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to send message:", error);
        return { error: `Failed to send message: ${error.message || JSON.stringify(error)}` };
    }
}

export async function getMessagesAction(unionId: string, limit = 50) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const { data, error } = await supabaseAdmin
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
