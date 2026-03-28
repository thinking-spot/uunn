'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * Verify that a user is a member of a union.
 * Returns the membership role if found, or null if not a member.
 */
export async function verifyMembership(unionId: string, userId: string): Promise<{ role: string } | null> {
    const { data } = await supabaseAdmin
        .from('Memberships')
        .select('role')
        .eq('union_id', unionId)
        .eq('user_id', userId)
        .single();
    return data;
}

/**
 * Verify that a user is an admin of a union.
 */
export async function verifyAdmin(unionId: string, userId: string): Promise<boolean> {
    const membership = await verifyMembership(unionId, userId);
    return membership?.role === 'admin';
}
