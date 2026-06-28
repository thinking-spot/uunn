'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { validate, messageContent, uuid } from '@/lib/validation';
import { verifyMembership } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/constants';
import { logError } from '@/lib/log';

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

        return { success: true };
    } catch (error: any) {
        logError('sendMessage failed', error);
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
        logError('getMessages failed', error);
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

/**
 * Mark either a union or alliance channel as read up to NOW for the current
 * user. Used by the messages page when the active channel changes / regains
 * focus so per-channel unread badges drain.
 */
export async function markChannelReadAction(
    channelKind: 'union' | 'alliance',
    channelId: string,
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const idV = validate(uuid, channelId);
    if ('error' in idV) return { error: idV.error };

    const table = channelKind === 'union' ? 'Memberships' : 'AllianceKeys';
    const fk = channelKind === 'union' ? 'union_id' : 'alliance_id';

    const { error } = await supabaseAdmin
        .from(table)
        .update({ last_read_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq(fk, channelId);

    if (error) {
        logError('markChannelRead failed', error);
        return { error: "Failed" };
    }
    return { success: true };
}

/**
 * Return per-channel unread counts (messages newer than the user's
 * last_read_at, not sent by the user themselves) across every union and
 * alliance the caller belongs to. Single round-trip, cheap to poll.
 */
export async function getUnreadCountsAction(): Promise<{
    unions: Record<string, number>;
    alliances: Record<string, number>;
}> {
    const session = await auth();
    if (!session?.user?.id) return { unions: {}, alliances: {} };

    // Fetch the caller's union channels + last_read_at, and alliance channels.
    const [{ data: memberships }, { data: allianceKeys }] = await Promise.all([
        supabaseAdmin
            .from('Memberships')
            .select('union_id, last_read_at')
            .eq('user_id', session.user.id),
        supabaseAdmin
            .from('AllianceKeys')
            .select('alliance_id, last_read_at')
            .eq('user_id', session.user.id),
    ]);

    const unions: Record<string, number> = {};
    const alliances: Record<string, number> = {};

    // Per-channel HEAD count queries in parallel. For users in many unions
    // this becomes a fan-out; it's fine at typical org sizes (a handful of
    // unions / alliances each). If this grows, replace with a single
    // grouped query via an RPC.
    await Promise.all([
        ...(memberships || []).map(async (m: any) => {
            const { count } = await supabaseAdmin
                .from('Messages')
                .select('*', { count: 'exact', head: true })
                .eq('union_id', m.union_id)
                .gt('created_at', m.last_read_at)
                .neq('sender_id', session.user!.id);
            unions[m.union_id] = count || 0;
        }),
        ...(allianceKeys || []).map(async (a: any) => {
            const { count } = await supabaseAdmin
                .from('AllianceMessages')
                .select('*', { count: 'exact', head: true })
                .eq('alliance_id', a.alliance_id)
                .gt('created_at', a.last_read_at)
                .neq('sender_id', session.user!.id);
            alliances[a.alliance_id] = count || 0;
        }),
    ]);

    return { unions, alliances };
}
