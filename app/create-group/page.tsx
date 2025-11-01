"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createIdentity, getCurrentUser, addUserGroup } from "@/lib/auth";
import { generateSecureId } from "@/lib/crypto";
import { createGroup } from "@/lib/api";
import { saveGroup } from "@/lib/storage";
import type { WorkplaceGroup, GroupMember } from "@/types";

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"identity" | "group">("identity");

  const [pseudonym, setPseudonym] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    // Check if user already has identity
    getCurrentUser().then((user) => {
      if (user) {
        setStep("group");
      }
    });
  }, []);

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createIdentity(pseudonym || undefined);
      setStep("group");
    } catch (err) {
      setError("Failed to create identity. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("No user identity found");
      }

      const groupId = generateSecureId();

      const newGroup: WorkplaceGroup = {
        id: groupId,
        name: groupName,
        description: groupDescription,
        createdAt: Date.now(),
        createdBy: user.id,
        memberCount: 1,
      };

      const creatorMember: Omit<GroupMember, 'id' | 'groupId' | 'joinedAt'> = {
        userId: user.id,
        pseudonym: user.pseudonym,
        publicKey: user.publicKey,
        role: 'admin',
      };

      // Create group on server
      const response = await createGroup(newGroup, creatorMember);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create group");
      }

      // Save locally
      await saveGroup(response.data.group, [response.data.member]);
      await addUserGroup(groupId);

      // Redirect to group page
      router.push(`/groups/${groupId}`);
    } catch (err) {
      setError("Failed to create group. Please try again.");
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
            <h1 className="text-xl font-bold">Create a Group</h1>
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
              <CardTitle>Create Your Workplace Group</CardTitle>
              <CardDescription>
                Set up a secure space for your coworkers to organize and coordinate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Group Name *
                  </label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Acme Corp Workers, Warehouse Team"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <Textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What is this group for?"
                    rows={4}
                    maxLength={500}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-sm">
                    <strong>Privacy Note:</strong> All group data is encrypted end-to-end.
                    Only members of your group can see messages and documents.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    "Create Group"
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
