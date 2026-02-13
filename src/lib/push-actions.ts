'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import webpush from 'web-push';

// Configure Web Push (Init once)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@uunn.io', // Real email recommended for production
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function saveSubscriptionAction(subscription: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { endpoint, keys } = subscription;

    const { error } = await supabaseAdmin
        .from('PushSubscriptions')
        .upsert({
            user_id: session.user.id,
            endpoint: endpoint,
            auth_key: keys.auth,
            p256dh_key: keys.p256dh
        }, { onConflict: 'endpoint' });

    if (error) {
        console.error("Save Sub Error", error);
        return { error: "Failed to save subscription" };
    }
    return { success: true };
}

export async function sendNotificationToUser(userId: string, payload: { title: string, body: string, url?: string }) {
    // 1. Get User's Subscriptions
    const { data: subs } = await supabaseAdmin
        .from('PushSubscriptions')
        .select('*')
        .eq('user_id', userId);

    if (!subs || subs.length === 0) return;

    // 2. Send to all devices
    const notifications = subs.map(sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.auth_key,
                p256dh: sub.p256dh_key
            }
        };

        return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
            .catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired/gone, remove from DB
                    console.log(`Subscription ${sub.id} expired, deleting.`);
                    return supabaseAdmin.from('PushSubscriptions').delete().eq('id', sub.id);
                }
                console.error("Push Error", err);
            });
    });

    await Promise.all(notifications);
}

export async function notifyUnionMembersAction(unionId: string, senderId: string, payload: { title: string, body: string, url?: string }) {
    // 1. Get Members of Union (Authorized check?)
    // This function is "internal" usually called by another action.
    // If called directly, we must verify caller permissions.
    // But for now, we assume it's called by sendMessageAction which does checks.

    // Optimisation: Fetch all relevant subscriptions in one go?
    // It's effectively: SELECT * FROM PushSubscriptions WHERE user_id IN (SELECT user_id FROM Memberships WHERE union_id = ?)

    // Exclude sender
    const { data: subs, error } = await supabaseAdmin
        .from('PushSubscriptions')
        .select(`
            *,
            user:Users!inner (
                id,
                memberships:Memberships!inner (
                    union_id
                )
            )
        `)
        // Filter by Membership in Union
        .eq('user.memberships.union_id', unionId)
        // Exclude sender
        .neq('user_id', senderId);

    if (error) {
        console.error("Failed to fetch targets", error);
        return;
    }

    // Above query is complex. Simpler approach:
    // 1. Get Member IDs
    const { data: members } = await supabaseAdmin
        .from('Memberships')
        .select('user_id')
        .eq('union_id', unionId);

    if (!members) return;

    const targetUserIds = members.map(m => m.user_id).filter(uid => uid !== senderId);

    if (targetUserIds.length === 0) return;

    // 2. Get Subs for these users
    const { data: targetSubs } = await supabaseAdmin
        .from('PushSubscriptions')
        .select('*')
        .in('user_id', targetUserIds);

    if (!targetSubs) return;

    // 3. Blast
    const processes = targetSubs.map(sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.auth_key,
                p256dh: sub.p256dh_key
            }
        };

        return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
            .catch(async err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseAdmin.from('PushSubscriptions').delete().eq('id', sub.id);
                }
            });
    });

    await Promise.all(processes);
}
