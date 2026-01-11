"use client";

import { useState, useEffect } from "react";
import { Plus, ThumbsUp, ThumbsDown, Loader2, CheckCircle, XCircle, Vote, Megaphone } from "lucide-react";
import { useUnion } from "@/context/UnionContext";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Issue, createIssue, getUnionIssues, voteOnIssue } from "@/services/issueService";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function VotesActionsPage() {
    const { user } = useAuth();
    const { activeUnion, unions, setActiveUnion } = useUnion();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [threshold, setThreshold] = useState<Issue["threshold"]>("simple");
    const [deadline, setDeadline] = useState("");

    useEffect(() => {
        if (activeUnion) {
            loadIssues();
        } else {
            setLoading(false);
        }
    }, [activeUnion]);

    const loadIssues = async () => {
        if (!activeUnion) return;
        setLoading(true);
        try {
            const data = await getUnionIssues(activeUnion.id);
            setIssues(data);
        } catch (error) {
            console.error("Failed to load votes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!user || !activeUnion || !title) return;
        setCreating(true);
        try {
            await createIssue(activeUnion.id, user.uid, {
                title,
                description,
                threshold,
                deadline
            });
            setTitle("");
            setDescription("");
            await loadIssues();
            setCreating(false);
        } catch (error) {
            console.error("Failed to create proposal", error);
        } finally {
            setCreating(false);
        }
    };

    const handleVote = async (issueId: string, vote: "for" | "against") => {
        if (!user) return;
        try {
            await voteOnIssue(issueId, user.uid, vote);
            await loadIssues();
        } catch (error) {
            alert("Failed to vote: " + error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votes & Actions</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Coordinate collective actions and voting.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <select
                            value={activeUnion?.id || ""}
                            onChange={(e) => setActiveUnion(unions.find(u => u.id === e.target.value) || null)}
                            className="h-10 rounded-md border bg-background px-3 text-sm w-full sm:w-auto"
                        >
                            <option value="" disabled>Select Union</option>
                            {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <button
                            onClick={() => setCreating(!creating)}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Propose Vote
                        </button>
                    </div>
                </div>

                {creating && (
                    <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm animate-in slide-in-from-top-2">
                        <h3 className="font-semibold text-lg mb-4">Create New Proposal</h3>
                        <div className="space-y-4">
                            <input
                                placeholder="Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                            />
                            <textarea
                                placeholder="Description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                            />
                            <div className="flex flex-col sm:flex-row gap-4">
                                <select
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value as any)}
                                    className="rounded-md border px-3 py-2 w-full"
                                >
                                    <option value="simple">Simple Majority</option>
                                    <option value="two-thirds">2/3 Majority</option>
                                    <option value="unanimous">Unanimous</option>
                                </select>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="rounded-md border px-3 py-2 w-full"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm">Cancel</button>
                                <button onClick={handleCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Create Proposal</button>
                            </div>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="active" className="w-full">
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:px-0 md:mx-0">
                        <TabsList className="mb-6 md:mb-8 inline-flex w-auto min-w-full md:min-w-0 justify-start">
                            <TabsTrigger value="active" className="flex items-center gap-2 whitespace-nowrap">
                                <Vote className="h-4 w-4" />
                                Active Votes
                            </TabsTrigger>
                            <TabsTrigger value="actions" className="flex items-center gap-2 whitespace-nowrap">
                                <Megaphone className="h-4 w-4" />
                                Union Actions
                            </TabsTrigger>
                            <TabsTrigger value="passed" className="flex items-center gap-2 whitespace-nowrap">
                                <CheckCircle className="h-4 w-4" />
                                Passed
                            </TabsTrigger>
                            <TabsTrigger value="failed" className="flex items-center gap-2 whitespace-nowrap">
                                <XCircle className="h-4 w-4" />
                                Failed
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active">
                        {loading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                        ) : issues.filter(i => i.status === 'active').length === 0 ? (
                            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground border-dashed">
                                <p>No active votes at this time.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {issues.filter(i => i.status === 'active').map(issue => (
                                    <VoteCard key={issue.id} issue={issue} user={user} totalVotes={issue.votesFor.length + issue.votesAgainst.length} handleVote={handleVote} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="actions">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl border bg-card p-6 opacity-60">
                                <div className="text-sm font-medium text-muted-foreground mb-2">Example Action</div>
                                <h3 className="font-semibold text-lg">Safety Walkout</h3>
                                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="w-1/3 h-full bg-primary"></div>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">33% committed</div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="passed">
                        {issues.filter(i => i.status === 'passed').length === 0 ? (
                            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground border-dashed">
                                <p>No passed votes yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {issues.filter(i => i.status === 'passed').map(issue => (
                                    <VoteCard key={issue.id} issue={issue} user={user} totalVotes={issue.votesFor.length + issue.votesAgainst.length} handleVote={handleVote} readonly />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="failed">
                        {issues.filter(i => i.status === 'failed').length === 0 ? (
                            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground border-dashed">
                                <p>No failed votes.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {issues.filter(i => i.status === 'failed').map(issue => (
                                    <VoteCard key={issue.id} issue={issue} user={user} totalVotes={issue.votesFor.length + issue.votesAgainst.length} handleVote={handleVote} readonly />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}

function VoteCard({ issue, user, totalVotes, handleVote, readonly = false }: { issue: Issue, user: any, totalVotes: number, handleVote: any, readonly?: boolean }) {
    const hasVoted = user && (issue.votesFor.includes(user.uid) || issue.votesAgainst.includes(user.uid));

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-lg">{issue.title}</h3>
                    <p className="text-muted-foreground mt-1">{issue.description}</p>
                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                        <span>Threshold: {issue.threshold}</span>
                        <span>Deadline: {issue.deadline}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{totalVotes}</div>
                    <div className="text-xs text-muted-foreground">Votes</div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex gap-4 w-full max-w-xs">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-green-600 font-medium">For ({issue.votesFor.length})</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${totalVotes ? (issue.votesFor.length / totalVotes) * 100 : 0}%` }} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-red-600 font-medium">Against ({issue.votesAgainst.length})</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${totalVotes ? (issue.votesAgainst.length / totalVotes) * 100 : 0}%` }} />
                        </div>
                    </div>
                </div>

                {!readonly && (
                    hasVoted ? (
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1.5 rounded-md text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Voted
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleVote(issue.id, "for")}
                                className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
                            >
                                <ThumbsUp className="h-4 w-4" />
                                Vote For
                            </button>
                            <button
                                onClick={() => handleVote(issue.id, "against")}
                                className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            >
                                <ThumbsDown className="h-4 w-4" />
                                Vote Against
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
