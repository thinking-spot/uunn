'use client';

import { useEffect, useState } from "react";
import { useUnion } from "@/context/UnionContext";
import { getDashboardStatsAction } from "@/lib/union-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, FileText, Users, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
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
    if (stats) setStats(stats);
    setLoading(false);
  };

  if (!activeUnion) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-2xl font-bold mb-2">No Union Selected</h2>
        <p className="text-muted-foreground mb-4">Select or create a union to view the dashboard.</p>
        <Link href="/unions">
          <Button>Go to Unions</Button>
        </Link>
      </div>
    );
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

// Helper icon
function Plus({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}
