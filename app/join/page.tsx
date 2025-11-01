"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createIdentity, getCurrentUser, addUserGroup } from "@/lib/auth";
import { getInvitation, joinGroup as joinGroupAPI } from "@/lib/api";
import { saveGroup } from "@/lib/storage";
import type { GroupMember } from "@/types";

export default function JoinGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"identity" | "invite">("identity");

  const [pseudonym, setPseudonym] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    // Check if user already has identity
    getCurrentUser().then((user) => {
      if (user) {
        setStep("invite");
      }
    });
  }, []);

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createIdentity(pseudonym || undefined);
      setStep("invite");
    } catch (err) {
      setError("Failed to create identity. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("No user identity found");
      }

      // Verify invite code exists
      const inviteResponse = await getInvitation(inviteCode.toUpperCase());
      if (!inviteResponse.success) {
        throw new Error("Invalid invite code");
      }

      const member: Omit<GroupMember, 'id' | 'groupId' | 'joinedAt'> = {
        userId: user.id,
        pseudonym: user.pseudonym,
        publicKey: user.publicKey,
        role: 'member',
      };

      // Join group via API
      const response = await joinGroupAPI(inviteCode.toUpperCase(), member);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to join group");
      }

      // Save locally
      await saveGroup(response.data.group, [response.data.member]);
      await addUserGroup(response.data.group.id);

      // Redirect to group
      router.push(`/groups/${response.data.group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join group. Please check the invite code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Join a Group</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {step === "identity" ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Identity</CardTitle>
              <CardDescription>
                Choose a pseudonym to protect your privacy. You can use any name you like.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateIdentity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pseudonym (optional)
                  </label>
                  <Input
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="e.g., BraveWorker123 (leave blank for random)"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    If left blank, a random pseudonym will be generated for you.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Identity...
                    </>
                  ) : (
                    "Create Identity"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Enter Invite Code</CardTitle>
              <CardDescription>
                Enter the invite code shared by your coworker to join their group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Invite Code *
                  </label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    required
                    maxLength={19}
                    className="font-mono text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: XXXX-XXXX-XXXX-XXXX
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-sm">
                    <strong>Security Note:</strong> Only join groups with people you trust.
                    All members can see group messages and activity.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !inviteCode}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining Group...
                    </>
                  ) : (
                    "Join Group"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
