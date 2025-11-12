"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Send, Copy, Check, ArrowLeft, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getGroup, getAllGroups, saveMessage, getMessages } from "@/lib/storage";
import { encryptMessage, decryptMessage, importKeyPair, importPublicKey, generateInviteCode } from "@/lib/crypto";
import { createInvitation, sendMessageMetadata } from "@/lib/api";
import { formatDate, formatTime, copyToClipboard } from "@/lib/utils";
import type { StoredGroup, StoredMessage, Message } from "@/types";

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<StoredGroup | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [resolvedParams.id]);

  const loadGroup = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/');
        return;
      }

      const groupData = await getGroup(resolvedParams.id);
      if (!groupData) {
        router.push('/');
        return;
      }

      setGroup(groupData);

      // Load messages
      const msgs = await getMessages(resolvedParams.id, 100);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to load group:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !group) return;

    setSending(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Import user's keys
      const keyPair = await importKeyPair({
        publicKey: user.publicKey,
        privateKey: user.privateKey,
      });

      // For now, encrypt with own public key (in production, encrypt for all members)
      const encrypted = await encryptMessage(
        messageInput,
        keyPair.publicKey,
        user.publicKey
      );

      const message: Omit<Message, 'id'> = {
        groupId: group.id,
        senderId: user.id,
        senderPseudonym: user.pseudonym,
        encryptedContent: encrypted.ciphertext,
        iv: encrypted.iv,
        timestamp: Date.now(),
        type: 'text',
      };

      // Send to server for sync
      const response = await sendMessageMetadata(message);

      if (response.success && response.data) {
        // Save locally
        const fullMessage: Message = {
          id: response.data.id,
          ...message,
        };

        await saveMessage(fullMessage, messageInput);

        // Update UI
        setMessages((prev) => [
          {
            id: fullMessage.id,
            groupId: fullMessage.groupId,
            encrypted: fullMessage,
            decrypted: messageInput,
            timestamp: fullMessage.timestamp,
          },
          ...prev,
        ]);

        setMessageInput("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!group) return;

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const code = generateInviteCode();

      const response = await createInvitation({
        code,
        groupId: group.id,
        createdBy: user.id,
        active: true,
      });

      if (response.success) {
        setInviteCode(code);
        setShowInvite(true);
      }
    } catch (err) {
      console.error("Failed to generate invite:", err);
    }
  };

  const handleCopyInvite = async () => {
    await copyToClipboard(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Group Not Found</CardTitle>
            <CardDescription>This group does not exist or you don't have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{group.group.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {group.members.length} members
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerateInvite}>
                <Users className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Link href={`/groups/${resolvedParams.id}/actions`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Invite Code</CardTitle>
              <CardDescription>
                Share this code with coworkers to invite them to the group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono text-lg"
                />
                <Button onClick={handleCopyInvite} size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This code can be used to join the group. Share it only with people you trust.
              </p>
              <Button onClick={() => setShowInvite(false)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4 mb-20">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm">
                    {msg.encrypted.senderPseudonym}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(msg.timestamp)} at {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm">
                  {msg.decrypted || "[Encrypted message - decryption pending]"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t p-4">
          <div className="container mx-auto max-w-4xl">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
