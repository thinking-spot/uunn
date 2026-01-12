import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sendMessageAction, getMessagesAction } from '@/lib/message-actions';

export interface MessageData {
    id: string;
    ciphertext: string;
    iv: string;
    senderId: string;
    senderName: string;
    channelId: string;
    createdAt: any;
    isOptimistic?: boolean; // New flag for UI
}

export function useMessages(unionId: string | null, channelId: string = "general") {
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loading, setLoading] = useState(false);

    // Ref to track messages without simple dependency loops
    const messagesRef = useRef<MessageData[]>([]);

    // Update ref when state changes
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // 1. Fetch & Subscribe
    useEffect(() => {
        if (!unionId) {
            setMessages([]);
            return;
        }

        setLoading(true);

        // Fetch Initial
        getMessagesAction(unionId).then(msgs => {
            const formatted: MessageData[] = msgs.map((m: any) => ({
                id: m.id,
                ciphertext: m.ciphertext,
                iv: m.iv,
                senderId: m.senderId,
                senderName: m.senderName,
                channelId: "general",
                createdAt: { seconds: new Date(m.createdAt).getTime() / 1000 }
            }));
            setMessages(formatted);
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

                    // Check if we already have this ID (deduplicate Optimistic vs Real)
                    if (messagesRef.current.some(m => m.id === newMsg.id)) {
                        // If it was optimistic, we might want to "confirm" it, 
                        // but since ID matches, we can just ignore or update status.
                        return;
                    }

                    // Fetch sender name locally or generic
                    const { data: user } = await supabase.from('Users').select('username').eq('id', newMsg.sender_id).single();

                    const formattedMsg: MessageData = {
                        id: newMsg.id,
                        ciphertext: newMsg.content_blob,
                        iv: newMsg.iv,
                        senderId: newMsg.sender_id,
                        senderName: user?.username || "Unknown",
                        channelId: "general",
                        createdAt: { seconds: new Date(newMsg.created_at).getTime() / 1000 }
                    };

                    setMessages(prev => {
                        // Deduplicate again inside setter
                        if (prev.some(m => m.id === formattedMsg.id)) return prev;
                        return [...prev, formattedMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [unionId, channelId]);

    // 2. Send Message (Optimistic)
    const sendMessage = useCallback(async (
        ciphertext: string,
        iv: string,
        senderId: string,
        senderName: string
    ) => {
        if (!unionId) return;

        // Create Optimistic Message
        // We need a temp ID. Supabase uses UUIDs. 
        // We can't easily guess the UUID Supabase will generate unless we generate it client-side.
        // STRATEGY: We won't try to match exact IDs for now. We'll show the Optimistic one, 
        // and when the Real one arrives, if it has a different ID, we might duplicate? 
        // NO, wait. `sendMessageAction` inserts. If we want deduplication, we should generate UUID client-side and pass it.
        // But `sendMessageAction` (current) lets Postgres generate ID.
        //
        // Simple Fix: Use a client-side generated UUID for the Optimistic message.
        // When the Real message arrives (with a different UUID from Postgres), we will have a duplicate.
        //
        // BETTER Fix: Allow passing ID to `sendMessageAction`.

        const tempId = crypto.randomUUID();

        const optimisticMsg: MessageData = {
            id: tempId,
            ciphertext,
            iv,
            senderId,
            senderName,
            channelId,
            createdAt: { seconds: Date.now() / 1000 },
            isOptimistic: true
        };

        // Add Optimistic Message immediately
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            // We pass the ID to the action so the DB uses the SAME ID.
            // This guarantees that when the Realtime event comes back with THIS ID,
            // our deduplication logic will catch it and prevent double rendering.
            const result = await sendMessageAction(unionId, ciphertext, iv, tempId); // Need to update Action signature!
            if (result.error) throw new Error(result.error);
        } catch (err) {
            console.error("Failed to send", err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            throw err;
        }
    }, [unionId, channelId]);

    return { messages, loading, sendMessage };
}
