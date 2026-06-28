'use client';

import { useState, useEffect } from "react";
import { useUnion } from "@/context/UnionContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { closeVoteAction } from "@/lib/vote-actions";
import { castEncryptedVote, createEncryptedVote, getDecryptedUnionVotes } from "@/lib/client-actions/votes";
import type { VoteData } from "@/lib/types";
import { getUnionDocumentsAction } from "@/lib/document-actions";
import type { Document } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, XCircle, Ban, Loader2, FileText, Paperclip, Lock } from "lucide-react";
import { toast } from "sonner";

// Friendly relative time for a future ISO timestamp ("in 3 hours", "in 2 days").
// Returns "soon" if it's within a minute. Past timestamps return "—".
function timeUntil(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 60_000) return diff <= 0 ? "—" : "soon";
    const minutes = Math.round(diff / 60_000);
    if (minutes < 60) return `in ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.round(hours / 24);
    if (days < 14) return `in ${days} day${days === 1 ? '' : 's'}`;
    const weeks = Math.round(days / 7);
    return `in ${weeks} week${weeks === 1 ? '' : 's'}`;
}

export default function VotesPage() {
    const { activeUnion } = useUnion();
    const { user } = useAuth();
    const [votes, setVotes] = useState<VoteData[]>([]);
    const [eligibleVoters, setEligibleVoters] = useState(0);
    const [loading, setLoading] = useState(true);

    // Create Form
    const [isCreating, setIsCreating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newClosesAt, setNewClosesAt] = useState("");
    const [newQuorum, setNewQuorum] = useState("");
    const [availableDocs, setAvailableDocs] = useState<Document[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

    // Track in-flight vote actions
    const [castingVote, setCastingVote] = useState<string | null>(null);
    const [closingVote, setClosingVote] = useState<string | null>(null);

    useEffect(() => {
        if (activeUnion) {
            loadVotes();
        }
    }, [activeUnion]);

    useEffect(() => {
        if (isCreating && activeUnion) {
            getUnionDocumentsAction(activeUnion.id).then(({ documents }) => {
                if (documents) setAvailableDocs(documents);
            });
        }
    }, [isCreating, activeUnion]);

    const loadVotes = async () => {
        if (!activeUnion || !user) return;
        setLoading(true);
        const { votes: data, eligibleVoters: count } = await getDecryptedUnionVotes(
            activeUnion.id,
            activeUnion.encryptionKey,
            user.uid,
        );
        if (data) setVotes(data);
        if (typeof count === 'number') setEligibleVoters(count);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!activeUnion || !newTitle) return;
        setCreating(true);
        try {
            // datetime-local emits a local-time string like "2026-07-01T18:30"; pass it
            // to the Date ctor (treated as local) and convert to ISO server-side.
            const closesAtIso = newClosesAt ? new Date(newClosesAt).toISOString() : null;
            const quorumPercent = newQuorum.trim() ? Number(newQuorum) : null;
            const { error } = await createEncryptedVote(
                activeUnion.id,
                newTitle,
                newDesc,
                selectedDocs,
                activeUnion.encryptionKey,
                { closesAt: closesAtIso, quorumPercent },
            );
            if (error) toast.error(error);
            else {
                setIsCreating(false);
                setNewTitle("");
                setNewDesc("");
                setNewClosesAt("");
                setNewQuorum("");
                setSelectedDocs([]);
                loadVotes();
            }
        } catch {
            toast.error("Error creating vote");
        } finally {
            setCreating(false);
        }
    };

    const toggleDoc = (id: string) => {
        if (selectedDocs.includes(id)) setSelectedDocs(selectedDocs.filter(d => d !== id));
        else setSelectedDocs([...selectedDocs, id]);
    };

    const handleVote = async (voteId: string, choice: 'yes' | 'no' | 'abstain') => {
        if (!activeUnion || !user) return;
        setCastingVote(voteId);
        try {
            const { error } = await castEncryptedVote(voteId, choice, activeUnion.encryptionKey, user.uid);
            if (error) toast.error(error);
            else loadVotes();
        } catch {
            toast.error("Error casting vote");
        } finally {
            setCastingVote(null);
        }
    };

    const handleClose = async (voteId: string) => {
        setClosingVote(voteId);
        try {
            const { error } = await closeVoteAction(voteId);
            if (error) toast.error(error);
            else {
                toast.success("Vote closed");
                loadVotes();
            }
        } catch {
            toast.error("Error closing vote");
        } finally {
            setClosingVote(null);
        }
    };

    if (!activeUnion) {
        return <div className="p-8 text-center text-muted-foreground">Select a union to view votes.</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Votes & Polls</h1>
                    <p className="text-muted-foreground">Democratic decision making for <strong>{activeUnion.name}</strong>.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="mr-2 h-4 w-4" /> New Vote
                </Button>
            </div>

            {isCreating && (
                <Card className="mb-8 border-primary/20">
                    <CardHeader>
                        <CardTitle>Create a New Poll</CardTitle>
                        <CardDescription>Ask the union for a decision.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="new-vote-title" className="block text-sm font-medium mb-1">Title</label>
                            <input
                                id="new-vote-title"
                                placeholder="Poll Title (e.g. Strike Authorization)"
                                className="w-full p-2 border rounded"
                                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="new-vote-desc" className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                id="new-vote-desc"
                                placeholder="Description / Details..."
                                className="w-full p-2 border rounded min-h-[80px] resize-y"
                                value={newDesc} onChange={e => setNewDesc(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="new-vote-closes" className="block text-sm font-medium mb-1">
                                    Closes at <span className="text-muted-foreground font-normal">(optional)</span>
                                </label>
                                <input
                                    id="new-vote-closes"
                                    type="datetime-local"
                                    className="w-full p-2 border rounded"
                                    value={newClosesAt}
                                    onChange={e => setNewClosesAt(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave blank to keep the vote open until you close it manually.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="new-vote-quorum" className="block text-sm font-medium mb-1">
                                    Quorum % <span className="text-muted-foreground font-normal">(optional)</span>
                                </label>
                                <input
                                    id="new-vote-quorum"
                                    type="number"
                                    min={1}
                                    max={100}
                                    placeholder="e.g. 50"
                                    className="w-full p-2 border rounded"
                                    value={newQuorum}
                                    onChange={e => setNewQuorum(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Percent of the {eligibleVoters || 0} members who must vote for the result to count.
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Attach Documents</label>
                            {availableDocs.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {availableDocs.map(doc => (
                                        <div
                                            key={doc.id}
                                            onClick={() => toggleDoc(doc.id)}
                                            className={`p-2 border rounded cursor-pointer text-sm flex items-center gap-2 ${selectedDocs.includes(doc.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedDocs.includes(doc.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                {selectedDocs.includes(doc.id) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <span className="truncate">{doc.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-2 border rounded text-sm flex items-center gap-2 text-muted-foreground opacity-60 cursor-default">
                                    <div className="w-4 h-4 rounded-full border border-muted-foreground flex-shrink-0" />
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <Link href="/documents" className="underline underline-offset-2 hover:text-foreground transition-colors">
                                        Create a Document
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setIsCreating(false); setSelectedDocs([]); }}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newTitle || creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Poll
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="space-y-4">
                {loading && (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && votes.length === 0 && (
                    <div className="text-center p-12 border border-dashed rounded-lg space-y-3">
                        <p className="text-muted-foreground">
                            No votes yet. Any member of <strong>{activeUnion?.name}</strong> can open a yes/no/abstain vote.
                            Choices are encrypted in your browser — the server never sees how anyone voted.
                        </p>
                        <Button size="sm" onClick={() => setIsCreating(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create the first vote
                        </Button>
                    </div>
                )}

                {votes.map(vote => {
                    // A vote is treated as effectively closed if either:
                    //   - the creator hit "Close Vote" (status === 'closed'), or
                    //   - it had a closes_at that's already passed.
                    // The server keeps status='open' for the second case until
                    // someone touches it; the client just renders it as closed.
                    const expired = !!vote.closes_at && new Date(vote.closes_at).getTime() <= Date.now();
                    const isOpen = vote.status === 'open' && !expired;
                    const isCreator = user?.uid === vote.created_by;
                    const canVote = isOpen && !vote.my_vote;
                    const isCasting = castingVote === vote.id;
                    const isClosing = closingVote === vote.id;
                    const quorumNeededVotes = vote.quorum_percent && eligibleVoters
                        ? Math.ceil((vote.quorum_percent / 100) * eligibleVoters)
                        : null;
                    const quorumMet = quorumNeededVotes !== null && vote.results.total >= quorumNeededVotes;
                    const unvoted = Math.max(0, eligibleVoters - vote.results.total);

                    return (
                        <Card key={vote.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{vote.title}</CardTitle>
                                        {vote.description && (
                                            <CardDescription className="mt-1">{vote.description}</CardDescription>
                                        )}
                                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>Created by {vote.created_by_name || 'Unknown'}</span>
                                            <span>{new Date(vote.created_at).toLocaleDateString()}</span>
                                        </div>

                                        {/* Participation strip: turnout, time-remaining, quorum status. */}
                                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                            {eligibleVoters > 0 ? (
                                                <span className="text-muted-foreground">
                                                    <strong className="text-foreground">{vote.results.total}</strong> of {eligibleVoters} {eligibleVoters === 1 ? 'member' : 'members'} voted
                                                    {isOpen && unvoted > 0 && (
                                                        <> · {unvoted} haven&apos;t yet</>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">{vote.results.total} vote{vote.results.total === 1 ? '' : 's'}</span>
                                            )}
                                            {isOpen && vote.closes_at && (
                                                <span className="text-muted-foreground">
                                                    · Closes {timeUntil(vote.closes_at)}
                                                </span>
                                            )}
                                            {expired && (
                                                <span className="text-muted-foreground">· Closed {new Date(vote.closes_at!).toLocaleString()}</span>
                                            )}
                                            {vote.quorum_percent && quorumNeededVotes !== null && (
                                                <span className={quorumMet ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                                                    · Quorum {vote.quorum_percent}% ({quorumNeededVotes} {quorumNeededVotes === 1 ? 'vote' : 'votes'}) {quorumMet ? 'met' : 'not yet met'}
                                                </span>
                                            )}
                                        </div>

                                        {vote.attached_documents && vote.attached_documents.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {vote.attached_documents.map(doc => (
                                                    <Link key={doc.id} href={`/documents/${doc.id}`} className="hover:underline">
                                                        <div className="flex items-center gap-1 text-xs bg-background border px-2 py-1 rounded shadow-sm text-primary">
                                                            <Paperclip className="h-3 w-3" />
                                                            {doc.title}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isCreator && isOpen && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleClose(vote.id)}
                                                disabled={isClosing}
                                                className="text-xs"
                                            >
                                                {isClosing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Lock className="mr-1 h-3 w-3" />}
                                                Close Vote
                                            </Button>
                                        )}
                                        <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {isOpen ? 'OPEN' : 'CLOSED'}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Voting Actions */}
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium mb-2">
                                            {!isOpen ? 'Voting is closed' : vote.my_vote ? 'You have voted' : 'Cast your vote:'}
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant={vote.my_vote === 'yes' ? "default" : "outline"}
                                                className={`justify-start ${vote.my_vote === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}
                                                onClick={() => handleVote(vote.id, 'yes')}
                                                disabled={!canVote || isCasting}
                                            >
                                                {isCasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                Yes
                                            </Button>
                                            <Button
                                                variant={vote.my_vote === 'no' ? "default" : "outline"}
                                                className={`justify-start ${vote.my_vote === 'no' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}
                                                onClick={() => handleVote(vote.id, 'no')}
                                                disabled={!canVote || isCasting}
                                            >
                                                {isCasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                                No
                                            </Button>
                                            <Button
                                                variant={vote.my_vote === 'abstain' ? "default" : "outline"}
                                                className={`justify-start ${vote.my_vote === 'abstain' ? 'bg-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                onClick={() => handleVote(vote.id, 'abstain')}
                                                disabled={!canVote || isCasting}
                                            >
                                                {isCasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                                                Abstain
                                            </Button>
                                        </div>
                                        {vote.my_vote && (
                                            <p className="text-xs text-muted-foreground text-center mt-2">
                                                You voted <strong>{vote.my_vote.toUpperCase()}</strong>
                                            </p>
                                        )}
                                    </div>

                                    {/* Results Visualization */}
                                    <div>
                                        <p className="text-sm font-medium mb-3">
                                            {isOpen ? 'Current' : 'Final'} Results ({vote.results.total} vote{vote.results.total !== 1 ? 's' : ''})
                                        </p>
                                        <ResultBar label="Yes" count={vote.results.yes} total={vote.results.total} color="bg-green-500" />
                                        <ResultBar label="No" count={vote.results.no} total={vote.results.total} color="bg-red-500" />
                                        <ResultBar label="Abstain" count={vote.results.abstain} total={vote.results.total} color="bg-gray-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function ResultBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span>{label}</span>
                <span className="font-mono">{count} ({percentage}%)</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
