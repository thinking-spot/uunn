import { sendMessageAction, getMessagesAction } from "@/lib/message-actions";
import { supabase } from "@/lib/supabase";

export interface MessageData {
    id: string;
    ciphertext: string;
    iv: string;
    senderId: string;
    senderName: string;
    channelId: string;
    createdAt: any;
}

export async function sendMessage(
    unionId: string,
    channelId: string,
    ciphertext: string,
    iv: string,
    senderId: string,
    senderName: string
) {
    const result = await sendMessageAction(unionId, ciphertext, iv);
    if (result.error) throw new Error(result.error);
}

export function subscribeToMessages(
    unionId: string,
    channelId: string,
    callback: (messages: MessageData[]) => void
) {
    let currentMessages: MessageData[] = [];

    // 1. Initial Load via Server Action (secure, gets username join)
    getMessagesAction(unionId).then(msgs => {
        currentMessages = msgs.map((m: any) => ({
            id: m.id,
            ciphertext: m.ciphertext,
            iv: m.iv,
            senderId: m.senderId,
            senderName: m.senderName,
            channelId: "general",
            createdAt: { seconds: new Date(m.createdAt).getTime() / 1000 }
        }));
        callback(currentMessages);
    });

    // 2. Subscribe to Realtime Updates
    // Note: The 'payload' from realtime does NOT include the joined username.
    // So we might have to fetch the user or just show "New Message" until refresh?
    // Better: We can optimize this by optimistic UI or fetching the single user.
    // Hack: For now, if "senderName" is missing, we'll placeholder it or quick fetch.
    const channel = supabase
        .channel(`union_messages:${unionId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'Messages', filter: `union_id=eq.${unionId}` },
            async (payload) => {
                const newMsg = payload.new as any;

                // Fetch sender name locally or generic
                // Optimization: If sender_id is ME, I know my name. If not, wait/fetch.
                // Minimal Fetch to upgrade the payload
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

                // Deduplicate just in case
                if (!currentMessages.some(m => m.id === formattedMsg.id)) {
                    currentMessages = [...currentMessages, formattedMsg];
                    callback(currentMessages);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
