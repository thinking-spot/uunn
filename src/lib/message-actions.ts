'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { notifyUnionMembersAction } from '@/lib/push-actions';
import { rateLimit } from '@/lib/rate-limit';
import { validate, messageContent, uuid } from '@/lib/validation';
import { verifyMembership } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/constants';

export async function sendMessageAction(
    unionId: string,
    contentBlob: string,
    iv: string,
    id?: string // Optional client-generated ID
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Validate input
    const v = validate(messageContent, { unionId, contentBlob, iv, id });
    if ('error' in v) return { error: v.error };

    // Verify caller is a member of this union
    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    // Rate limit: 30 messages per user per minute
    const { allowed } = rateLimit(`msg:${session.user.id}`, RATE_LIMITS.MESSAGES.max, RATE_LIMITS.MESSAGES.windowMs);
    if (!allowed) return { error: "Rate limit exceeded. Please slow down." };

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
        return { error: "Failed to send message" };
    }
}

export async function getMessagesAction(unionId: string, limit = 50, before?: string) {
    const session = await auth();
    if (!session?.user?.id) return { messages: [], hasMore: false };

    const v = validate(uuid, unionId);
    if ('error' in v) return { messages: [], hasMore: false };

    if (!await verifyMembership(unionId, session.user.id)) return { messages: [], hasMore: false };

    // Fetch limit+1 to detect if there are more
    let query = supabaseAdmin
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
        .order('created_at', { ascending: false })
        .limit(limit + 1);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error || !data) {
        console.error("Error fetching messages:", error);
        return { messages: [], hasMore: false };
    }

    const hasMore = data.length > limit;
    const trimmed = hasMore ? data.slice(0, limit) : data;

    // Reverse to chronological order (we fetched desc for cursor pagination)
    const messages = trimmed.reverse().map((m: any) => ({
        id: m.id,
        ciphertext: m.content_blob,
        iv: m.iv,
        senderId: m.sender_id,
        senderName: m.sender.username,
        createdAt: m.created_at
    }));

    return { messages, hasMore };
}
