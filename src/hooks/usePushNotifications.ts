import { useState, useEffect } from 'react';
import { saveSubscriptionAction } from '@/lib/push-actions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Check current subscription
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    setIsSubscribed(!!subscription);
                    setLoading(false);
                });
            });
        } else {
            setError("Push notifications not supported");
            setLoading(false);
        }
    }, []);

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            setError("VAPID Key missing");
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log("Service Worker Registered");

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log("Got Push Subscription", subscription);

            // Send to server
            const result = await saveSubscriptionAction(JSON.parse(JSON.stringify(subscription)));

            if (result.error) throw new Error(result.error);

            setIsSubscribed(true);
        } catch (e: any) {
            console.error("Subscription failed", e);
            setError(e.message || "Failed to subscribe");
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, subscribe, loading, error };
}
