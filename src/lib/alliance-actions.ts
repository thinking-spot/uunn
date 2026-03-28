'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { validate, uuid, allianceMessageContent, encryptedPayload } from '@/lib/validation';
import { RATE_LIMITS } from '@/lib/constants';

// --- Authorization Helpers ---

async function verifyAllianceMember(allianceId: string, userId: string): Promise<boolean> {
    // User must have an alliance key to be considered a member
    const { data } = await supabaseAdmin
        .from('AllianceKeys')
        .select('user_id')
        .eq('alliance_id', allianceId)
        .eq('user_id', userId)
        .single();
    return !!data;
}

async function verifyAllianceAdmin(allianceId: string, userId: string): Promise<boolean> {
    // Get both union IDs from the alliance
    const { data: alliance } = await supabaseAdmin
        .from('UnionAlliances')
        .select('union_a_id, union_b_id')
        .eq('id', allianceId)
        .single();
    if (!alliance) return false;

    // Check if user is admin of either union
    const { data } = await supabaseAdmin
        .from('Memberships')
        .select('role')
        .eq('user_id', userId)
        .in('union_id', [alliance.union_a_id, alliance.union_b_id])
        .eq('role', 'admin')
        .limit(1);
    return !!data && data.length > 0;
}

// --- Alliance Keys ---

export async function setAllianceKeysAction(
    allianceId: string,
    keys: { userId: string; encryptedSharedKey: string }[]
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Only an admin of one of the allied unions can distribute keys
    if (!await verifyAllianceAdmin(allianceId, session.user.id)) {
        return { error: "Not authorized — alliance admin only" };
    }

    const rows = keys.map(k => ({
        alliance_id: allianceId,
        user_id: k.userId,
        encrypted_shared_key: k.encryptedSharedKey
    }));

    const { error } = await supabaseAdmin
        .from('AllianceKeys')
        .upsert(rows, { onConflict: 'alliance_id,user_id' });

    if (error) {
        console.error("Set Alliance Keys Error:", error);
        return { error: "Failed to set alliance keys" };
    }
    return { success: true };
}

export async function getMyAllianceKeyAction(allianceId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { data, error } = await supabaseAdmin
        .from('AllianceKeys')
        .select('encrypted_shared_key')
        .eq('alliance_id', allianceId)
        .eq('user_id', session.user.id)
        .single();

    if (error || !data) return { error: "Alliance key not found" };
    return { encryptedSharedKey: data.encrypted_shared_key };
}

// --- Alliance Members (for key distribution) ---

export async function getAllianceMembersAction(allianceId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Only admins of allied unions can fetch member lists (for key distribution)
    if (!await verifyAllianceAdmin(allianceId, session.user.id)) {
        return { error: "Not authorized — alliance admin only" };
    }

    // Get both union IDs from the alliance
    const { data: alliance, error: allianceError } = await supabaseAdmin
        .from('UnionAlliances')
        .select('union_a_id, union_b_id')
        .eq('id', allianceId)
        .single();

    if (allianceError || !alliance) return { error: "Alliance not found" };

    // Get all members of both unions with their public keys
    const { data: members, error: membersError } = await supabaseAdmin
        .from('Memberships')
        .select('user_id, user:Users(id, username, public_key)')
        .or(`union_id.eq.${alliance.union_a_id},union_id.eq.${alliance.union_b_id}`);

    if (membersError) return { error: "Failed to fetch members" };

    // Deduplicate (user might be in both unions)
    const seen = new Set<string>();
    const unique = (members || []).filter((m: any) => {
        if (seen.has(m.user_id)) return false;
        seen.add(m.user_id);
        return true;
    }).map((m: any) => ({
        userId: m.user.id,
        username: m.user.username,
        publicKey: m.user.public_key
    }));

    return { members: unique };
}

// --- Alliance Messages ---

export async function sendAllianceMessageAction(
    allianceId: string,
    contentBlob: string,
    iv: string,
    id?: string
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Validate input
    const v = validate(allianceMessageContent, { allianceId, contentBlob, iv, id });
    if ('error' in v) return { error: v.error };

    // Verify caller is an alliance member
    if (!await verifyAllianceMember(allianceId, session.user.id)) {
        return { error: "Not authorized — alliance members only" };
    }

    // Rate limit: 30 messages per user per minute
    const { allowed } = rateLimit(`amsg:${session.user.id}`, RATE_LIMITS.MESSAGES.max, RATE_LIMITS.MESSAGES.windowMs);
    if (!allowed) return { error: "Rate limit exceeded. Please slow down." };

    const payload: Record<string, unknown> = {
        alliance_id: allianceId,
        sender_id: session.user.id,
        content_blob: contentBlob,
        iv
    };
    if (id) payload.id = id;

    const { error } = await supabaseAdmin
        .from('AllianceMessages')
        .insert(payload);

    if (error) {
        console.error("Failed to send alliance message:", error);
        return { error: "Failed to send message" };
    }
    return { success: true };
}

export async function getAllianceMessagesAction(allianceId: string, limit = 50, before?: string) {
    const session = await auth();
    if (!session?.user?.id) return { messages: [], hasMore: false };

    if (!await verifyAllianceMember(allianceId, session.user.id)) return { messages: [], hasMore: false };

    let query = supabaseAdmin
        .from('AllianceMessages')
        .select(`
            id,
            content_blob,
            iv,
            sender_id,
            created_at,
            sender:Users (username)
        `)
        .eq('alliance_id', allianceId)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error || !data) return { messages: [], hasMore: false };

    const hasMore = data.length > limit;
    const trimmed = hasMore ? data.slice(0, limit) : data;

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

// --- Get user's alliances with keys ---

export async function getMyAlliancesAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Get all alliances where the user has a key
    const { data: keys, error: keysError } = await supabaseAdmin
        .from('AllianceKeys')
        .select(`
            alliance_id,
            encrypted_shared_key,
            alliance:UnionAlliances (
                id,
                status,
                union_a:Unions!union_a_id(id, name),
                union_b:Unions!union_b_id(id, name)
            )
        `)
        .eq('user_id', session.user.id);

    if (keysError || !keys) return [];

    return keys
        .filter((k: any) => k.alliance?.status === 'active')
        .map((k: any) => ({
            allianceId: k.alliance_id,
            encryptedSharedKey: k.encrypted_shared_key,
            unionA: k.alliance.union_a,
            unionB: k.alliance.union_b,
            name: `${k.alliance.union_a.name} + ${k.alliance.union_b.name}`
        }));
}
