"use client";

import { useEffect, useState, useRef } from "react";
import { Paperclip, Send, ShieldCheck, Lock, Loader2, MessageSquare, ArrowRightLeft, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserUnions } from "@/lib/client-actions/unions";
import { useMessages } from "@/hooks/useMessages";
import { useAllianceMessages } from "@/hooks/useAllianceMessages";
import { getMyAlliancesAction } from "@/lib/alliance-actions";
import { unwrapKey, encryptContent, decryptContent } from "@/lib/crypto";
import { aadFor } from "@/lib/aad";
import { getMyPrivateKey } from "@/lib/client-crypto";
import ProtectedRoute from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DecryptedMessage, Channel } from "@/lib/types";

export default function MessagesPage() {
    const { user } = useAuth();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [textInput, setTextInput] = useState("");
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [mobileChannelOpen, setMobileChannelOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hooks for both channel types — only one will be active at a time
    const isAlliance = activeChannel?.type === "alliance";
    const unionHook = useMessages(isAlliance ? null : activeChannel?.id ?? null);
    const allianceHook = useAllianceMessages(isAlliance ? activeChannel?.id ?? null : null);
    const activeHook = isAlliance ? allianceHook : unionHook;

    const { messages: rawMessages, loading, sendMessage: sendMessageFn, hasMore, loadingMore, loadMore } = activeHook;

    // Derived State: Decrypted Messages
    const [messages, setMessages] = useState<DecryptedMessage[]>([]);

    // 1. Load channels (unions + alliances)
    useEffect(() => {
        if (!user) return;

        const loadChannels = async () => {
            const [unions, alliances] = await Promise.all([
                getUserUnions(user.uid),
                getMyAlliancesAction()
            ]);

            const unionChannels: Channel[] = unions.map(u => ({
                type: "union" as const,
                id: u.id,
                name: u.name,
                encryptedKey: u.encryptionKey,
                subtitle: "#general"
            }));

            const allianceChannels: Channel[] = (Array.isArray(alliances) ? alliances : []).map((a: any) => ({
                type: "alliance" as const,
                id: a.allianceId,
                name: a.name,
                encryptedKey: a.encryptedSharedKey,
                subtitle: "Alliance"
            }));

            const all = [...unionChannels, ...allianceChannels];
            setChannels(all);
            if (all.length > 0 && !activeChannel) {
                setActiveChannel(all[0]);
            }
        };

        loadChannels();
    }, [user]);

    // 2. Import Key when active channel changes
    useEffect(() => {
        if (!activeChannel?.encryptedKey) {
            setKey(null);
            return;
        }

        const decryptKey = async () => {
            try {
                const privKey = await getMyPrivateKey();
                const sharedKey = await unwrapKey(activeChannel.encryptedKey, privKey);
                setKey(sharedKey);
            } catch {
                // KeyNotLoadedError or unwrap failure — leave key null. The
                // unlock gate handles the not-loaded case at the layout level.
                setKey(null);
            }
        };
        decryptKey();
    }, [activeChannel]);

    // 3. Decrypt Messages when they change OR key changes
    useEffect(() => {
        if (!key || rawMessages.length === 0) {
            if (rawMessages.length > 0 && !key) {
                setMessages(rawMessages.map(m => ({ id: m.id, senderId: m.senderId, senderName: m.senderName, createdAt: m.createdAt, isOptimistic: m.isOptimistic, text: "Encrypted..." })));
            } else {
                setMessages([]);
            }
            return;
        }

        const decryptAll = async () => {
            const decrypted = await Promise.all(rawMessages.map(async (m) => {
                const aad = activeChannel?.type === 'alliance'
                    ? aadFor.allianceMessage(activeChannel.id, m.id)
                    : activeChannel
                        ? aadFor.message(activeChannel.id, m.id)
                        : undefined;
                try {
                    const text = await decryptContent(m.ciphertext, m.iv, key, aad);
                    return { id: m.id, senderId: m.senderId, senderName: m.senderName, createdAt: m.createdAt, isOptimistic: m.isOptimistic, text };
                } catch {
                    return { id: m.id, senderId: m.senderId, senderName: m.senderName, createdAt: m.createdAt, isOptimistic: m.isOptimistic, text: "Error decrypting" };
                }
            }));
            setMessages(decrypted);
        };
        decryptAll();
    }, [rawMessages, key]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const handleSend = async () => {
        if (!textInput.trim() || !user || !activeChannel) return;
        if (!key) {
            toast.error("Encryption key not available. Try switching channels or refreshing.");
            return;
        }

        try {
            const id = crypto.randomUUID();
            const aad = activeChannel.type === 'alliance'
                ? aadFor.allianceMessage(activeChannel.id, id)
                : aadFor.message(activeChannel.id, id);
            const { cipherText, iv } = await encryptContent(textInput, key, aad);
            await sendMessageFn(id, cipherText, iv, user.uid, user.displayName || "Unknown");
            setTextInput("");
        } catch {
            toast.error("Failed to send message");
        }
    };

    const hasChannels = channels.length > 0;

    return (
        <ProtectedRoute>
            {!hasChannels ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h1 className="text-2xl font-bold">Secure Messaging</h1>
                        <p className="text-muted-foreground mt-2">Join a union to start chatting securely.</p>
                    </div>
                </div>
            ) : (
                <div className="flex h-full">
                    {/* Channel List / Sidebar */}
                    <div className="w-64 border-r bg-card flex-col hidden md:flex">
                        <div className="p-4 border-b font-semibold flex items-center justify-between">
                            <span>Messages</span>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {channels.map(ch => (
                                <button
                                    key={`${ch.type}-${ch.id}`}
                                    onClick={() => setActiveChannel(ch)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                                        activeChannel?.id === ch.id && activeChannel?.type === ch.type
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0",
                                        ch.type === "alliance"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-primary/10 text-primary"
                                    )}>
                                        {ch.type === "alliance"
                                            ? <ArrowRightLeft className="h-5 w-5" />
                                            : ch.name.substring(0, 2).toUpperCase()
                                        }
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate">{ch.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{ch.subtitle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="border-b bg-card/50">
                            <div className="h-16 flex items-center justify-between px-6">
                                <button
                                    className="flex items-center gap-3 md:pointer-events-none"
                                    onClick={() => setMobileChannelOpen(!mobileChannelOpen)}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                                        activeChannel?.type === "alliance"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-primary/10 text-primary"
                                    )}>
                                        {activeChannel?.type === "alliance"
                                            ? <ArrowRightLeft className="h-5 w-5" />
                                            : activeChannel?.name.substring(0, 2).toUpperCase()
                                        }
                                    </div>
                                    <div>
                                        <div className="font-bold flex items-center gap-1">
                                            {activeChannel?.name}
                                            <ChevronDown className={cn("h-4 w-4 md:hidden transition-transform", mobileChannelOpen && "rotate-180")} />
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                            End-to-end Encrypted
                                            {activeChannel?.type === "alliance" && (
                                                <span className="ml-1 text-emerald-600 font-medium">- Alliance</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Mobile Channel Dropdown */}
                            {mobileChannelOpen && (
                                <div className="md:hidden border-t bg-card p-2 space-y-1 max-h-64 overflow-y-auto">
                                    {channels.map(ch => (
                                        <button
                                            key={`mobile-${ch.type}-${ch.id}`}
                                            onClick={() => { setActiveChannel(ch); setMobileChannelOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                                activeChannel?.id === ch.id && activeChannel?.type === ch.type
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                                                ch.type === "alliance"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-primary/10 text-primary"
                                            )}>
                                                {ch.type === "alliance"
                                                    ? <ArrowRightLeft className="h-4 w-4" />
                                                    : ch.name.substring(0, 2).toUpperCase()
                                                }
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-medium truncate text-sm">{ch.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{ch.subtitle}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {hasMore && (
                                <div className="text-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border hover:bg-muted disabled:opacity-50"
                                    >
                                        {loadingMore ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                                        {loadingMore ? "Loading..." : "Load older messages"}
                                    </button>
                                </div>
                            )}
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12">
                                    <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === user?.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] md:max-w-md ${isMe ? "" : "bg-card border"} rounded-2xl px-4 py-2 shadow-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "rounded-tl-none"}`}>
                                                {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</div>}
                                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                                    <div className="text-[10px]">
                                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sending..."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-card/50">
                            <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2 focus-within:ring-2 ring-primary/20 transition-all shadow-sm">
                                <button
                                    className="text-muted-foreground opacity-50 cursor-not-allowed"
                                    title="File attachments coming soon"
                                    disabled
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <input
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1"
                                    placeholder={`Message ${activeChannel?.name}...`}
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!textInput.trim()}
                                    className="text-primary hover:text-primary/80 disabled:opacity-50 transition-colors p-1"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
