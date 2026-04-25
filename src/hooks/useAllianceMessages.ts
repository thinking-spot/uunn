import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sendAllianceMessageAction, getAllianceMessagesAction } from '@/lib/alliance-actions';
import { resolveUsername, cacheUsername } from '@/lib/username-cache';
import type { MessageData } from '@/lib/types';

export type { MessageData as AllianceMessageData };

export function useAllianceMessages(allianceId: string | null) {
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesRef = useRef<MessageData[]>([]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Fetch & Subscribe
    useEffect(() => {
        if (!allianceId) {
            setMessages([]);
            return;
        }

        setLoading(true);

        getAllianceMessagesAction(allianceId).then(result => {
            const formatted: MessageData[] = result.messages.map((m: any) => {
                cacheUsername(m.senderId, m.senderName);
                return {
                    id: m.id,
                    ciphertext: m.ciphertext,
                    iv: m.iv,
                    senderId: m.senderId,
                    senderName: m.senderName,
                    createdAt: { seconds: new Date(m.createdAt).getTime() / 1000 }
                };
            });
            setMessages(formatted);
            setHasMore(result.hasMore);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load alliance messages:", err);
            setLoading(false);
        });

        // Realtime Subscription
        const channel = supabase
            .channel(`alliance_messages:${allianceId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'AllianceMessages', filter: `alliance_id=eq.${allianceId}` },
                async (payload) => {
                    const newMsg = payload.new as any;

                    if (messagesRef.current.some(m => m.id === newMsg.id)) {
                        return;
                    }

                    const senderName = await resolveUsername(newMsg.sender_id);

                    const formattedMsg: MessageData = {
                        id: newMsg.id,
                        ciphertext: newMsg.content_blob,
                        iv: newMsg.iv,
                        senderId: newMsg.sender_id,
                        senderName,
                        createdAt: { seconds: new Date(newMsg.created_at).getTime() / 1000 }
                    };

                    setMessages(prev => {
                        if (prev.some(m => m.id === formattedMsg.id)) return prev;
                        return [...prev, formattedMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [allianceId]);

    // Load More (older messages)
    const loadMore = useCallback(async () => {
        if (!allianceId || !hasMore || loadingMore) return;
        setLoadingMore(true);

        const oldest = messagesRef.current[0];
        if (!oldest) { setLoadingMore(false); return; }

        const oldestTimestamp = new Date(oldest.createdAt.seconds * 1000).toISOString();

        try {
            const result = await getAllianceMessagesAction(allianceId, 50, oldestTimestamp);
            const formatted: MessageData[] = result.messages.map((m: any) => {
                cacheUsername(m.senderId, m.senderName);
                return {
                    id: m.id,
                    ciphertext: m.ciphertext,
                    iv: m.iv,
                    senderId: m.senderId,
                    senderName: m.senderName,
                    createdAt: { seconds: new Date(m.createdAt).getTime() / 1000 }
                };
            });
            setMessages(prev => [...formatted, ...prev]);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error("Failed to load more alliance messages:", err);
        } finally {
            setLoadingMore(false);
        }
    }, [allianceId, hasMore, loadingMore]);

    // Send Message (Optimistic). Caller passes a pre-generated message id so
    // they can bind it into AAD when encrypting (see aad.ts / H3).
    const sendMessage = useCallback(async (
        id: string,
        ciphertext: string,
        iv: string,
        senderId: string,
        senderName: string,
    ) => {
        if (!allianceId) return;

        const optimisticMsg: MessageData = {
            id,
            ciphertext,
            iv,
            senderId,
            senderName,
            createdAt: { seconds: Date.now() / 1000 },
            isOptimistic: true,
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const result = await sendAllianceMessageAction(allianceId, ciphertext, iv, id);
            if (result.error) throw new Error(result.error);
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== id));
            throw err;
        }
    }, [allianceId]);

    return { messages, loading, sendMessage, hasMore, loadingMore, loadMore };
}
