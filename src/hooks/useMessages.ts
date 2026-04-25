import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sendMessageAction, getMessagesAction } from '@/lib/message-actions';
import { resolveUsername, cacheUsername } from '@/lib/username-cache';
import type { MessageData } from '@/lib/types';

export type { MessageData };

export function useMessages(unionId: string | null) {
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
        if (!unionId) {
            setMessages([]);
            return;
        }

        setLoading(true);

        getMessagesAction(unionId).then(result => {
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
            console.error("Failed to load messages:", err);
            setLoading(false);
        });

        // Realtime Subscription
        const channel = supabase
            .channel(`union_messages:${unionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Messages', filter: `union_id=eq.${unionId}` },
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
    }, [unionId]);

    // Load More (older messages)
    const loadMore = useCallback(async () => {
        if (!unionId || !hasMore || loadingMore) return;
        setLoadingMore(true);

        const oldest = messagesRef.current[0];
        if (!oldest) { setLoadingMore(false); return; }

        const oldestTimestamp = new Date(oldest.createdAt.seconds * 1000).toISOString();

        try {
            const result = await getMessagesAction(unionId, 50, oldestTimestamp);
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
            console.error("Failed to load more messages:", err);
        } finally {
            setLoadingMore(false);
        }
    }, [unionId, hasMore, loadingMore]);

    // Send Message (Optimistic). Caller must pass a pre-generated message id
    // so they can bind it into AAD when encrypting (see aad.ts / H3).
    const sendMessage = useCallback(async (
        id: string,
        ciphertext: string,
        iv: string,
        senderId: string,
        senderName: string,
    ) => {
        if (!unionId) return;

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
            const result = await sendMessageAction(unionId, ciphertext, iv, id);
            if (result.error) throw new Error(result.error);
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== id));
            throw err;
        }
    }, [unionId]);

    return { messages, loading, sendMessage, hasMore, loadingMore, loadMore };
}
