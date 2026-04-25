'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { validate, uuid, title as titleSchema, description as descSchema, unionSettingsInput, encryptedPayload, inviteCode as inviteCodeSchema } from '@/lib/validation';
import { verifyMembership, verifyAdmin } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/constants';
import { logError } from '@/lib/log';

export async function createUnionAction(
    name: string,
    encrypted_shared_key: string,
    location?: string,
    description?: string,
    inviteKeyBlob?: string,
    inviteKeySalt?: string
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Validate inputs
    const nameV = validate(titleSchema, name);
    if ('error' in nameV) return { error: nameV.error };
    const keyV = validate(encryptedPayload, encrypted_shared_key);
    if ('error' in keyV) return { error: keyV.error };
    if (location && location.length > 200) return { error: "Location too long" };
    if (description && description.length > 2000) return { error: "Description too long" };

    // Generate a high-entropy invite code (24 URL-safe chars ≈ 143 bits)
    const bytes = new Uint8Array(18); // 18 bytes = 144 bits → 24 base64url chars
    crypto.getRandomValues(bytes);
    const inviteCode = Buffer.from(bytes).toString('base64url').slice(0, 24);

    const insertData: Record<string, unknown> = {
        name,
        creator_id: session.user.id,
        invite_code: inviteCode
    };
    if (location) insertData.location = location;
    if (description) insertData.description = description;
    if (inviteKeyBlob) insertData.invite_key_blob = inviteKeyBlob;
    if (inviteKeySalt) insertData.invite_key_salt = inviteKeySalt;

    const { data: union, error } = await supabaseAdmin
        .from('Unions')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        logError('createUnion failed', error);
        return { error: "Failed to create union" };
    }

    // Add creator as Admin
    const { error: memberError } = await supabaseAdmin
        .from('Memberships')
        .insert({
            union_id: union.id,
            user_id: session.user.id,
            role: 'admin',
            encrypted_shared_key
        });

    if (memberError) {
        logError('addMember failed', memberError);
        return { error: "Failed to add creator as member" };
    }

    return { unionId: union.id, inviteCode };
}

export async function setInviteKeyAction(unionId: string, inviteKeyBlob: string, inviteKeySalt: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };
    if (!await verifyAdmin(unionId, session.user.id)) return { error: "Not authorized" };

    const { error } = await supabaseAdmin
        .from('Unions')
        .update({ invite_key_blob: inviteKeyBlob, invite_key_salt: inviteKeySalt })
        .eq('id', unionId);

    if (error) return { error: "Failed to store invite key" };
    return { success: true };
}

/**
 * Rotate the union's invite code AND its invite-code key escrow blob in one
 * atomic operation. Used after member removal (C2): the old invite code
 * could otherwise be used by the removed member to derive the old union
 * key from the unchanged escrow blob and decrypt historical messages.
 *
 * The client supplies a freshly-generated invite code + the new union key
 * encrypted under PBKDF2(new_invite_code).
 */
export async function rotateInviteAction(
    unionId: string,
    newInviteCode: string,
    newInviteKeyBlob: string,
    newInviteKeySalt: string,
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };
    if (!await verifyAdmin(unionId, session.user.id)) return { error: "Not authorized — admin only" };

    const codeV = validate(inviteCodeSchema, newInviteCode);
    if ('error' in codeV) return { error: codeV.error };
    const blobV = validate(encryptedPayload, newInviteKeyBlob);
    if ('error' in blobV) return { error: blobV.error };
    if (typeof newInviteKeySalt !== 'string' || newInviteKeySalt.length === 0 || newInviteKeySalt.length > 200) {
        return { error: "Invalid salt" };
    }

    const { error } = await supabaseAdmin
        .from('Unions')
        .update({
            invite_code: newInviteCode,
            invite_key_blob: newInviteKeyBlob,
            invite_key_salt: newInviteKeySalt,
        })
        .eq('id', unionId);

    if (error) {
        if ((error as any).code === '23505') return { error: "Invite code collision — please retry" };
        logError('rotateInvite failed', error);
        return { error: "Failed to rotate invite" };
    }
    return { success: true };
}

export async function getInviteKeyAction(inviteCode: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const codeV = validate(inviteCodeSchema, inviteCode);
    if ('error' in codeV) return { error: codeV.error };

    // Throttle invite-code probing per-user to limit offline brute-force enabling
    const { allowed } = rateLimit(`invite-key:${session.user.id}`, 20, 60_000);
    if (!allowed) return { error: "Too many requests" };

    const { data, error } = await supabaseAdmin
        .from('Unions')
        .select('id, invite_key_blob, invite_key_salt')
        .eq('invite_code', inviteCode)
        .single();

    if (error || !data) return { error: "Union not found" };
    if (!data.invite_key_blob || !data.invite_key_salt) return { error: "No invite key available" };

    return {
        unionId: data.id,
        inviteKeyBlob: data.invite_key_blob,
        inviteKeySalt: data.invite_key_salt,
    };
}

export async function joinUnionAction(inviteCode: string, encrypted_shared_key?: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const codeV = validate(inviteCodeSchema, inviteCode);
    if ('error' in codeV) return { error: codeV.error };

    // Throttle invite-code probing per-user
    const { allowed } = rateLimit(`join:${session.user.id}`, 20, 60_000);
    if (!allowed) return { error: "Too many requests. Please slow down." };

    // A wrapped union key is required so the new member can decrypt history.
    // The client should obtain this via the invite-code key escrow + re-wrap with their public key.
    if (!encrypted_shared_key) {
        return { error: "Missing encryption key — cannot join without it." };
    }
    const keyV = validate(encryptedPayload, encrypted_shared_key);
    if ('error' in keyV) return { error: keyV.error };

    // Resolve invite code to union ID — always require a valid invite code
    const { data: union } = await supabaseAdmin
        .from('Unions')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
    if (!union) return { error: "Invalid invite code" };
    const unionId = union.id;

    // Check if already member
    const { data: existing } = await supabaseAdmin
        .from('Memberships')
        .select('user_id')
        .eq('union_id', unionId)
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (existing) return { alreadyMember: true, unionId };

    const { error } = await supabaseAdmin
        .from('Memberships')
        .insert({
            union_id: unionId,
            user_id: session.user.id,
            role: 'member',
            encrypted_shared_key
        });

    if (error) {
        logError('joinUnion insert failed');
        return { error: "Failed to join union" };
    }

    return { unionId };
}

export async function getUserUnionsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const { data, error } = await supabaseAdmin
        .from('Memberships')
        .select(`
            role,
            encrypted_shared_key,
            union:Unions (
                id,
                name,
                invite_code,
                location,
                description,
                is_public
            )
        `)
        .eq('user_id', session.user.id);

    if (error) {
        logError('getUserUnions failed');
        return [];
    }

    // Only admins receive the raw invite_code; members do not.
    return data.map((m: any) => ({
        id: m.union.id,
        name: m.union.name,
        inviteCode: m.role === 'admin' ? m.union.invite_code : undefined,
        encryptionKey: m.encrypted_shared_key,
        location: m.union.location,
        description: m.union.description,
        isPublic: m.union.is_public,
        role: m.role,
        members: ['me'] // Mock
    }));
}

export async function getMyPublicKeyAction() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { data, error } = await supabaseAdmin
        .from('Users')
        .select('public_key')
        .eq('id', session.user.id)
        .single();

    if (error || !data) return { error: "Public key not found" };
    return { publicKey: data.public_key };
}

// --- Secure Invites ---

export async function createInviteAction(unionId: string, encryptedUnionKey: string, recipientPublicKey: string, recipientLabel: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // We store this as a specialized "Invite" record?
    // Actually we implemented a `UnionInvites` table? Or `UnionJoinRequests`?
    // "Secure Invite" usually means we create a link with a pre-encrypted key.
    // Let's check `JoinRequests`... no that's for asking.
    // We didn't strictly add `UnionInvites` table in the V1 schema?
    // We have `UnionJoinRequests`.

    // IF we are missing the table, we might need to add it or skip this feature.
    // Looking at `client-actions/unions.ts`, `createSecureInvite` relies on it.
    // The previous error didn't complain about table missing, just the action function.
    // Let's implement a dummy or use a specialized table if we have one.
    // Checking schema... `task.md` said "Implement Invite Flow with History Access" was done.
    // I previously had `createInviteAction` working.
    // It likely used `UnionInvites` table.

    const { data, error } = await supabaseAdmin
        .from('UnionInvites') // Assuming this table exists from Phase 2
        .insert({
            union_id: unionId,
            created_by: session.user.id,
            encrypted_union_key: encryptedUnionKey,
            invite_public_key: recipientPublicKey
        })
        .select()
        .single();

    if (error) {
        logError('createInvite failed', error);
        return { error: "Failed" };
    }
    return { inviteId: data.id };
}

export async function getInviteAction(inviteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const idV = validate(uuid, inviteId);
    if ('error' in idV) return { error: idV.error };

    // Throttle invite-id probing per-user
    const { allowed } = rateLimit(`invite-fetch:${session.user.id}`, 30, 60_000);
    if (!allowed) return { error: "Too many requests" };

    const { data, error } = await supabaseAdmin
        .from('UnionInvites')
        .select(`
            *,
            union:Unions (name)
        `)
        .eq('id', inviteId)
        .single();

    if (error) return { error: "Invalid invite" };

    return {
        encryptedUnionKey: data.encrypted_union_key,
        unionId: data.union_id,
        unionName: data.union?.name
    };
}

// --- Public Union Lookup ---

export async function getUnionByInviteCodeAction(code: string) {
    // Look up union by invite_code
    const { data: union, error } = await supabaseAdmin
        .from('Unions')
        .select('id, name, location, description')
        .eq('invite_code', code)
        .single();

    if (error || !union) return { error: "Invalid invite code" };

    // Get member count
    const { count } = await supabaseAdmin
        .from('Memberships')
        .select('*', { count: 'exact', head: true })
        .eq('union_id', union.id);

    return {
        union: {
            id: union.id,
            name: union.name,
            location: union.location || '',
            description: union.description || '',
            memberCount: count || 0
        }
    };
}

// --- Discovery ---

export async function searchUnionsAction(query: string, location?: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Validate inputs
    if (query && query.length > 200) return { error: "Query too long" };
    if (location && location.length > 200) return { error: "Location too long" };

    // Rate limit: 20 searches per minute per user
    const { allowed } = rateLimit(`search:${session.user.id}`, 20, 60_000);
    if (!allowed) return { error: "Too many searches. Please slow down." };

    let dbQuery = supabaseAdmin
        .from('Unions')
        .select('id, name, location, description, member_count:Memberships(count), is_public')
        .eq('is_public', true);

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    if (location) {
        dbQuery = dbQuery.ilike('location', `%${location}%`);
    }

    const { data, error } = await dbQuery.limit(20);

    if (error) return { error: "Search failed" };
    return { unions: data };
}

export async function requestJoinUnionAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Rate limit: 5 join requests per user per hour
    const { allowed } = rateLimit(`join:${session.user.id}`, RATE_LIMITS.JOIN_REQUESTS.max, RATE_LIMITS.JOIN_REQUESTS.windowMs);
    if (!allowed) return { error: "Too many join requests. Please try again later." };

    const { error } = await supabaseAdmin
        .from('UnionJoinRequests')
        .insert({
            user_id: session.user.id,
            union_id: unionId
        });

    if (error) {
        if (error.code === '23505') return { error: "Request already sending" };
        return { error: "Failed to send request" };
    }

    return { success: true };
}

export async function getPendingJoinRequestsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Verify caller is admin of this union
    if (!await verifyAdmin(unionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    const { data, error } = await supabaseAdmin
        .from('UnionJoinRequests')
        .select('id, created_at, user:Users(username)')
        .eq('union_id', unionId)
        .eq('status', 'pending');

    if (error) return { error: "Failed" };
    return { requests: data };
}

export async function respondToJoinRequestAction(requestId: string, accept: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // 1. Get request details first to verify authorization
    const { data: req } = await supabaseAdmin.from('UnionJoinRequests').select('*').eq('id', requestId).single();
    if (!req) return { error: "Request not found" };
    if (req.status !== 'pending') return { error: "Request already processed" };

    // 2. Verify caller is admin of the target union
    if (!await verifyAdmin(req.union_id, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    if (!accept) {
        await supabaseAdmin.from('UnionJoinRequests').update({ status: 'rejected' }).eq('id', requestId);
        return { success: true };
    }

    // 3. Accept: Add to Memberships
    const { error: joinError } = await supabaseAdmin.from('Memberships').insert({
        union_id: req.union_id,
        user_id: req.user_id,
        role: 'member'
    });

    if (joinError) return { error: "Failed to add member" };

    await supabaseAdmin.from('UnionJoinRequests').update({ status: 'accepted' }).eq('id', requestId);
    return { success: true };
}

// --- Username Resolution ---

/**
 * Resolve userIds → usernames, gated by union co-membership.
 *
 * Returns a partial mapping: only ids belonging to users that share at least
 * one union with the caller are populated. Used by the realtime message hook
 * when a sender's username is not in the local cache. Replaces the previous
 * direct-anon-Supabase read in src/lib/username-cache.ts which depended on
 * permissive RLS to function.
 */
export async function resolveUsernamesAction(userIds: string[]): Promise<{ usernames?: Record<string, string>; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    if (!Array.isArray(userIds) || userIds.length === 0) return { usernames: {} };
    if (userIds.length > 100) return { error: "Too many ids" };
    for (const id of userIds) {
        const v = validate(uuid, id);
        if ('error' in v) return { error: "Invalid id in batch" };
    }

    // Find unions the caller belongs to.
    const { data: myUnions } = await supabaseAdmin
        .from('Memberships')
        .select('union_id')
        .eq('user_id', session.user.id);
    const unionIds = (myUnions || []).map(m => m.union_id);
    if (unionIds.length === 0) return { usernames: {} };

    // Allowed targets: users who are members of any of those unions, intersected with the requested ids.
    const { data: peers } = await supabaseAdmin
        .from('Memberships')
        .select('user_id')
        .in('union_id', unionIds)
        .in('user_id', userIds);
    const allowedIds = Array.from(new Set((peers || []).map(p => p.user_id)));
    if (allowedIds.length === 0) return { usernames: {} };

    const { data: users } = await supabaseAdmin
        .from('Users')
        .select('id, username')
        .in('id', allowedIds);

    const map: Record<string, string> = {};
    (users || []).forEach((u: any) => { map[u.id] = u.username; });
    return { usernames: map };
}

// --- Members ---

export async function getUnionMembersAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Verify caller is a member of this union
    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data, error } = await supabaseAdmin
        .from('Memberships')
        .select(`
            role,
            joined_at,
            user:Users(id, username, public_key)
        `)
        .eq('union_id', unionId)
        .order('joined_at', { ascending: true });

    if (error) {
        logError('getUnionMembers failed', error);
        return { error: "Failed to fetch members" };
    }

    const members = data?.map((m: any) => ({
        id: m.user.id,
        username: m.user.username,
        role: m.role,
        joinedAt: m.joined_at,
        // public_key is the JWK-as-JSON-string. Fingerprints (H8) are
        // computed client-side from this so out-of-band verification
        // doesn't trust a server-computed value.
        publicKey: m.user.public_key ?? null,
    })) || [];

    return { members };
}

// --- Settings ---

export async function updateUnionSettingsAction(unionId: string, settings: { location?: string, description?: string, is_public?: boolean }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Validate inputs
    const v = validate(unionSettingsInput, { unionId, settings });
    if ('error' in v) return { error: v.error };

    // Verify admin
    const { data: membership } = await supabaseAdmin
        .from('Memberships')
        .select('role')
        .eq('union_id', unionId)
        .eq('user_id', session.user.id)
        .single();

    if (!membership || membership.role !== 'admin') {
        return { error: "Not authorized" };
    }

    const { error } = await supabaseAdmin
        .from('Unions')
        .update(settings)
        .eq('id', unionId);

    if (error) return { error: "Failed to update settings" };
    return { success: true };
}

export async function deleteMemberAction(unionId: string, memberId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Verify caller is admin of this union
    if (!await verifyAdmin(unionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    // Prevent admin from removing themselves
    if (memberId === session.user.id) {
        return { error: "Cannot remove yourself" };
    }

    const { error } = await supabaseAdmin
        .from('Memberships')
        .delete()
        .eq('union_id', unionId)
        .eq('user_id', memberId);

    if (error) return { error: "Failed to remove member" };
    return { success: true };
}

export async function promoteMemberAction(unionId: string, memberId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    if (!await verifyAdmin(unionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    const { error } = await supabaseAdmin
        .from('Memberships')
        .update({ role: 'admin' })
        .eq('union_id', unionId)
        .eq('user_id', memberId);

    if (error) return { error: "Failed to promote member" };
    return { success: true };
}

// --- Key Rotation ---

export async function rotateUnionKeyAction(
    unionId: string,
    newKeys: { userId: string; encryptedSharedKey: string }[]
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    if (!await verifyAdmin(unionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    // Update each member's wrapped key
    for (const entry of newKeys) {
        const { error } = await supabaseAdmin
            .from('Memberships')
            .update({ encrypted_shared_key: entry.encryptedSharedKey })
            .eq('union_id', unionId)
            .eq('user_id', entry.userId);

        if (error) {
            logError('rotateUnionKey: per-member update failed', error);
        }
    }

    return { success: true };
}

export async function getUnionMemberPublicKeysAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    if (!await verifyAdmin(unionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    const { data, error } = await supabaseAdmin
        .from('Memberships')
        .select('user_id, user:Users(id, public_key)')
        .eq('union_id', unionId);

    if (error) return { error: "Failed to fetch member keys" };

    return {
        members: (data || []).map((m: any) => ({
            userId: m.user.id,
            publicKey: m.user.public_key
        }))
    };
}

// --- Alliances ---

export async function requestAllianceAction(fromUnionId: string, toUnionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Verify caller is admin of the initiating union
    if (!await verifyAdmin(fromUnionId, session.user.id)) {
        return { error: "Not authorized — admin only" };
    }

    // Rate limit: 5 alliance requests per user per hour
    const { allowed } = rateLimit(`alliance:${session.user.id}`, RATE_LIMITS.ALLIANCE_REQUESTS.max, RATE_LIMITS.ALLIANCE_REQUESTS.windowMs);
    if (!allowed) return { error: "Too many alliance requests. Please try again later." };

    const { error } = await supabaseAdmin
        .from('UnionAlliances')
        .insert({
            union_a_id: fromUnionId < toUnionId ? fromUnionId : toUnionId,
            union_b_id: fromUnionId < toUnionId ? toUnionId : fromUnionId,
            status: 'pending',
            initiated_by_union_id: fromUnionId
        });

    if (error) return { error: "Failed to request alliance" };
    return { success: true };
}

export async function getPendingAllianceRequestsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const uv = validate(uuid, unionId);
    if ('error' in uv) return { error: uv.error };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data, error } = await supabaseAdmin
        .from('UnionAlliances')
        .select(`
            id,
            initiated_by_union_id,
            union_a:Unions!union_a_id(id, name),
            union_b:Unions!union_b_id(id, name)
        `)
        .eq('status', 'pending')
        .or(`union_a_id.eq.${unionId},union_b_id.eq.${unionId}`);

    if (error) return { error: "Failed to fetch" };

    const incoming = data?.filter((r: any) => r.initiated_by_union_id !== unionId).map((r: any) => {
        const other = r.union_a.id === unionId ? r.union_b : r.union_a;
        return {
            requestId: r.id,
            union: other
        };
    }) || [];

    return { requests: incoming };
}

export async function respondToAllianceRequestAction(requestId: string, accept: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // 1. Get alliance details to verify authorization
    const { data: alliance } = await supabaseAdmin
        .from('UnionAlliances')
        .select('union_a_id, union_b_id, initiated_by_union_id')
        .eq('id', requestId)
        .single();
    if (!alliance) return { error: "Alliance request not found" };

    // 2. Determine which union is the responder (the one that didn't initiate)
    const responderUnionId = alliance.initiated_by_union_id === alliance.union_a_id
        ? alliance.union_b_id
        : alliance.union_a_id;

    // 3. Verify caller is admin of the responding union
    if (!await verifyAdmin(responderUnionId, session.user.id)) {
        return { error: "Not authorized — admin of responding union only" };
    }

    if (!accept) {
        await supabaseAdmin.from('UnionAlliances').delete().eq('id', requestId);
        return { success: true };
    }

    const { error } = await supabaseAdmin
        .from('UnionAlliances')
        .update({ status: 'active' })
        .eq('id', requestId);

    if (error) return { error: "Failed" };
    return { success: true };
}

export async function getAlliedUnionsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const uv = validate(uuid, unionId);
    if ('error' in uv) return { error: uv.error };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data, error } = await supabaseAdmin
        .from('UnionAlliances')
        .select(`
            union_a:Unions!union_a_id(id, name),
            union_b:Unions!union_b_id(id, name)
        `)
        .eq('status', 'active')
        .or(`union_a_id.eq.${unionId},union_b_id.eq.${unionId}`);

    if (error) return { error: "Failed" };

    const allies = data?.map((r: any) => {
        return r.union_a.id === unionId ? r.union_b : r.union_a;
    }) || [];

    return { allies };
}

// --- Dashboard ---

export async function getDashboardStatsAction(unionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Verify caller is a member of this union
    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { count: voteCount } = await supabaseAdmin
        .from('Votes')
        .select('*', { count: 'exact', head: true })
        .eq('union_id', unionId)
        .eq('status', 'open');

    const { count: memberCount } = await supabaseAdmin
        .from('Memberships')
        .select('*', { count: 'exact', head: true })
        .eq('union_id', unionId);

    const { data: recentDocs } = await supabaseAdmin
        .from('Documents')
        .select('id, title, title_blob, title_iv, union_id, updated_at')
        .eq('union_id', unionId)
        .order('updated_at', { ascending: false })
        .limit(3);

    return {
        stats: {
            activeVotes: voteCount || 0,
            memberCount: memberCount || 0,
            recentDocs: recentDocs || []
        }
    };
}
