"use client";

import { useEffect, useState, useRef } from "react";
import { Search, MoreVertical, Paperclip, Send, ShieldCheck, Lock, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserUnions, Union } from "@/services/unionService";
import { useMessages, MessageData } from "@/hooks/useMessages";
import { importPrivateKey, unwrapKey, encryptContent, decryptContent } from "@/lib/crypto";
import ProtectedRoute from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";

interface DecryptedMessage extends MessageData {
    text: string;
}

export default function MessagesPage() {
    const { user } = useAuth();
    const [unions, setUnions] = useState<Union[]>([]);
    const [activeUnion, setActiveUnion] = useState<Union | null>(null);
    const [textInput, setTextInput] = useState("");
    const [key, setKey] = useState<CryptoKey | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Custom Hook handles fetching, realtime, and optimistic sending
    const { messages: rawMessages, loading, sendMessage } = useMessages(activeUnion?.id || null);

    // Derived State: Decrypted Messages
    const [messages, setMessages] = useState<DecryptedMessage[]>([]);

    // 1. Load User's Unions
    useEffect(() => {
        if (user) {
            getUserUnions(user.uid).then(data => {
                setUnions(data);
                if (data.length > 0) {
                    setActiveUnion(data[0]);
                }
            });
        }
    }, [user]);

    // 2. Import Key when Active Union changes
    useEffect(() => {
        if (activeUnion && activeUnion.encryptionKey) {
            const decryptKey = async () => {
                try {
                    const privKeyStr = localStorage.getItem('uunn_private_key');
                    if (!privKeyStr) throw new Error("Private key not found");
                    const privKey = await importPrivateKey(JSON.parse(privKeyStr));
                    const sharedKey = await unwrapKey(activeUnion.encryptionKey, privKey);
                    setKey(sharedKey);
                } catch (err) {
                    console.error("Failed to decrypt union key", err);
                }
            };
            decryptKey();
        }
    }, [activeUnion]);

    // 3. Decrypt Messages when they change OR key changes
    useEffect(() => {
        if (!key || rawMessages.length === 0) {
            if (rawMessages.length > 0 && !key) {
                setMessages(rawMessages.map(m => ({ ...m, text: "🔒 Encrypted..." })));
            } else {
                setMessages([]);
            }
            return;
        }

        const decryptAll = async () => {
            const decrypted = await Promise.all(rawMessages.map(async (m) => {
                // If we already decrypted it? (Optimization for later)
                try {
                    const text = await decryptContent(m.ciphertext, m.iv, key);
                    return { ...m, text };
                } catch (e) {
                    return { ...m, text: "Error decrypting" };
                }
            }));
            setMessages(decrypted);
        };
        decryptAll();
    }, [rawMessages, key]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]); // depend on length to scroll on new arrival

    const handleSend = async () => {
        if (!textInput.trim() || !user || !activeUnion || !key) return;

        try {
            const { cipherText, iv } = await encryptContent(textInput, key);
            // Optimistic Send via Hook
            await sendMessage(cipherText, iv, user.uid, user.displayName || "Unknown");
            setTextInput("");
        } catch (error) {
            console.error("Error sending message", error);
            alert("Failed to send message");
        }
    };

    return (
        <ProtectedRoute>
            {!activeUnion ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                    <div>
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h1 className="text-2xl font-bold">Secure Messaging</h1>
                        <p className="text-muted-foreground mt-2">Join a union to start chatting securely.</p>
                    </div>
                </div>
            ) : (
                <div className="flex h-full">
                    {/* Unions List / Sidebar */}
                    <div className="w-64 border-r bg-card flex-col hidden md:flex">
                        <div className="p-4 border-b font-semibold flex items-center justify-between">
                            <span>Messages</span>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {unions.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setActiveUnion(u)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                                        activeUnion.id === u.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {u.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium truncate">{u.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">#general</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="h-16 border-b flex items-center justify-between px-6 bg-card/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold md:hidden">
                                    {activeUnion.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold">{activeUnion.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                        End-to-end Encrypted
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                                    <Search className="h-5 w-5" />
                                </button>
                                <button className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                <button className="text-muted-foreground hover:text-primary transition-colors">
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <input
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1"
                                    placeholder={`Message #${activeUnion.name}...`}
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
