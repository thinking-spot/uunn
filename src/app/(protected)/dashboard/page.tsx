'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnion } from "@/context/UnionContext";
import { useAuth } from "@/context/AuthContext";
import { getDashboardStatsAction } from "@/lib/union-actions";
import { decryptContent } from "@/lib/crypto";
import { aadFor } from "@/lib/aad";
import { getUnionKey } from "@/lib/client-crypto";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, FileText, Users, MessageSquare, ArrowRight, Loader2, Plus, Compass, KeyRound, BookOpen } from "lucide-react";
import Link from "next/link";

type DashboardStats = {
  activeVotes: number;
  recentDocs: { id: string, title: string, updated_at: string }[];
  memberCount: number;
};

export default function DashboardPage() {
  const { activeUnion } = useUnion();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeUnion) {
      loadStats();
    }
  }, [activeUnion]);

  const loadStats = async () => {
    if (!activeUnion) return;
    setLoading(true);
    const { stats } = await getDashboardStatsAction(activeUnion.id);
    if (!stats) {
      setLoading(false);
      return;
    }

    // Decrypt document titles client-side (H4). Falls back to plaintext for
    // legacy rows or when the union key is unavailable.
    let unionKey: CryptoKey | null = null;
    try { unionKey = await getUnionKey(activeUnion.encryptionKey); } catch { unionKey = null; }

    const recentDocs = await Promise.all(
      (stats.recentDocs as Array<{ id: string; title: string; title_blob?: string | null; title_iv?: string | null; union_id?: string; updated_at: string }>).map(async (d) => {
        let title = d.title;
        if (unionKey && d.title_blob && d.title_iv && d.union_id) {
          try {
            title = await decryptContent(d.title_blob, d.title_iv, unionKey, aadFor.documentTitle(d.union_id, d.id));
          } catch { /* keep placeholder */ }
        }
        return { id: d.id, title, updated_at: d.updated_at };
      })
    );

    setStats({ ...stats, recentDocs });
    setLoading(false);
  };

  if (!activeUnion) {
    return <OnboardingEmptyState />;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
          {activeUnion.name} Dashboard
        </h1>
        <p className="text-muted-foreground">Overview of your union's activity.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Active Votes Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats?.activeVotes}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeVotes === 1 ? '1 vote requires action' : `${stats?.activeVotes || 0} votes currently open`}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/votes" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                {stats?.activeVotes ? 'Vote Now' : 'Create Vote'} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Members Card */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats?.memberCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered members
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/members" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Manage <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Documents Shortcut */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats?.recentDocs.length}</div>
            <p className="text-xs text-muted-foreground">Recent updates</p>
          </CardContent>
          <CardFooter>
            <Link href="/documents" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View Docs <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Chat Shortcut */}
        <Card className="hover:border-primary/50 transition-colors bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Secure Chat</div>
            <p className="text-xs text-muted-foreground">
              End-to-End Encrypted
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/messages" className="w-full">
              <Button className="w-full">
                Open Chat <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>


      {/* Recent Documents List */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest collaborative drafts and plans.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {stats?.recentDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents yet.</p>
                ) : (
                  stats?.recentDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{doc.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{new Date(doc.updated_at).toLocaleDateString()}</span>
                        <Link href={`/documents/${doc.id}`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><ArrowRight className="h-3 w-3" /></Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for organizers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/votes" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" /> Create New Poll
              </Button>
            </Link>
            <Link href="/documents" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" /> Draft New Document
              </Button>
            </Link>
            <Link href="/unions" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" /> Invite New Members
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OnboardingEmptyState() {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    // Push to the public /join/[code] flow; if the user happens to be logged
    // in (they are, on this page), it'll resolve the union and let them join.
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}.
        </h1>
        <p className="text-muted-foreground mt-2">
          You&apos;re not in a union yet. Pick one of the paths below to get started.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors flex flex-col">
          <CardHeader>
            <Plus className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-lg">Start a union</CardTitle>
            <CardDescription>
              You&apos;re the first organizer at your workplace. Create a union and invite your coworkers.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/unions?tab=create" className="w-full">
              <Button className="w-full">Create a union <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:border-primary/50 transition-colors flex flex-col">
          <CardHeader>
            <KeyRound className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-lg">Got an invite?</CardTitle>
            <CardDescription>
              Paste the invite code or link a coworker sent you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinByCode} className="space-y-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Invite code"
                aria-label="Invite code"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" variant="outline" className="w-full" disabled={!code.trim()}>
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors flex flex-col">
          <CardHeader>
            <Compass className="h-6 w-6 text-primary mb-2" />
            <CardTitle className="text-lg">Find a union</CardTitle>
            <CardDescription>
              Browse unions that are open to public discovery and request to join.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Link href="/unions?tab=discover" className="w-full">
              <Button variant="outline" className="w-full">
                Browse public unions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 flex items-start gap-3 text-sm">
        <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="text-muted-foreground">
          <p>
            New to organizing? Read{" "}
            <Link href="/how-it-works" className="text-foreground underline hover:no-underline">
              how uunn works
            </Link>{" "}
            and the{" "}
            <Link href="/education" className="text-foreground underline hover:no-underline">
              organizing guides
            </Link>
            . Always organize on a personal device on a non-work network — see{" "}
            <Link href="/security" className="text-foreground underline hover:no-underline">
              the security page
            </Link>
            {" "}for why.
          </p>
        </div>
      </div>
    </div>
  );
}
