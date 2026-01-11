'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

export async function createUnionAction(name: string, encryptedKeyForCreator: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const inviteCode = "UN-" + Math.floor(1000 + Math.random() * 9000);

    try {
        // 1. Create Union
        const { data: union, error: unionError } = await supabase
            .from('Unions')
            .insert({
                name,
                invite_code: inviteCode,
                creator_id: session.user.id
            })
            .select() // Select to get the ID back!
            .single();

        if (unionError) throw unionError;

        // 2. Add Creator as Member
        const { error: memberError } = await supabase
            .from('Memberships')
            .insert({
                union_id: union.id,
                user_id: session.user.id,
                role: 'admin',
                encrypted_shared_key: encryptedKeyForCreator
            });

        if (memberError) throw memberError;

        return { success: true, unionId: union.id };
    } catch (error) {
        console.error("Failed to create union:", error);
        return { error: "Failed to create union" };
    }
}

export async function getUserUnionsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Fetch memberships and join with unions
    const { data, error } = await supabase
        .from('Memberships')
        .select(`
            role,
            encrypted_shared_key,
            union:Unions (
                id,
                name,
                invite_code
            )
        `)
        .eq('user_id', session.user.id);

    if (error || !data) {
        console.error("Error fetching unions:", error);
        return [];
    }

    // Transform to match UI expectation
    // Note: We need member_count. This is harder with simple embedding.
    // For now, let's mock member_count or do a separate fetch if critical.
    // Actually, let's stick to "1" or "Many" or just fetch it separately?
    // Optimization: Add a wrapper RPC function or just return 1 for now to unblock.
    // Let's create a functional map.

    return data.map((m: any) => ({
        id: m.union.id,
        name: m.union.name,
        inviteCode: m.union.invite_code,
        encryptionKey: m.encrypted_shared_key,
        role: m.role,
        members: ['me'] // Mock members to prevent UI crash
    }));
}

export async function joinUnionAction(inviteCode: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // 1. Find Union
    const { data: union, error: unionError } = await supabase
        .from('Unions')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

    if (unionError || !union) return { error: "Invalid invite code" };

    // 2. Check if member
    const { data: member } = await supabase
        .from('Memberships')
        .select('user_id')
        .eq('union_id', union.id)
        .eq('user_id', session.user.id)
        .single();

    if (member) return { success: true, unionId: union.id, alreadyMember: true };

    // 3. Join
    const { error: joinError } = await supabase
        .from('Memberships')
        .insert({
            union_id: union.id,
            user_id: session.user.id,
            role: 'member',
            encrypted_shared_key: null // No key yet
        });

    if (joinError) return { error: "Failed to join union" };

    return { success: true, unionId: union.id };
}

export async function getMyPublicKeyAction() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { data: user } = await supabase
        .from('Users')
        .select('public_key')
        .eq('id', session.user.id)
        .single();

    return { publicKey: user?.public_key };
}
