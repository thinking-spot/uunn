'use client';

import { useState, useEffect } from "react";
import { useUnion } from "@/context/UnionContext";
import { createVoteAction, getUnionVotesAction, castVoteAction, VoteData } from "@/lib/vote-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react";

export default function VotesPage() {
    const { activeUnion } = useUnion();
    const [votes, setVotes] = useState<VoteData[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Form
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");

    useEffect(() => {
        if (activeUnion) {
            loadVotes();
        }
    }, [activeUnion]);

    const loadVotes = async () => {
        if (!activeUnion) return;
        setLoading(true);
        const { votes: data, error } = await getUnionVotesAction(activeUnion.id);
        if (data) setVotes(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!activeUnion || !newTitle) return;
        try {
            const { error } = await createVoteAction(activeUnion.id, newTitle, newDesc);
            if (error) alert(error);
            else {
                setIsCreating(false);
                setNewTitle("");
                setNewDesc("");
                loadVotes();
            }
        } catch (e) {
            alert("Error creating vote");
        }
    };

    const handleVote = async (voteId: string, choice: 'yes' | 'no' | 'abstain') => {
        try {
            const { error } = await castVoteAction(voteId, choice);
            if (error) alert(error);
            else {
                loadVotes(); // Refresh to show updated results/my_vote
            }
        } catch (e) {
            alert("Error casting vote");
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
                        <input
                            placeholder="Poll Title (e.g. Strike Authorization)"
                            className="w-full p-2 border rounded"
                            value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="Description / Details..."
                            className="w-full p-2 border rounded"
                            value={newDesc} onChange={e => setNewDesc(e.target.value)}
                        />
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Poll</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="space-y-4">
                {votes.length === 0 && !loading && (
                    <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                        No active votes. Create one to get started.
                    </div>
                )}

                {votes.map(vote => (
                    <Card key={vote.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{vote.title}</CardTitle>
                                    <CardDescription className="mt-1">{vote.description}</CardDescription>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full ${vote.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {vote.status.toUpperCase()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Voting Actions */}
                                <div className="space-y-3">
                                    <p className="text-sm font-medium mb-2">Cast your vote:</p>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant={vote.my_vote === 'yes' ? "default" : "outline"}
                                            className={`justify-start ${vote.my_vote === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'}`}
                                            onClick={() => handleVote(vote.id, 'yes')}
                                            disabled={!!vote.my_vote}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Yes
                                        </Button>
                                        <Button
                                            variant={vote.my_vote === 'no' ? "default" : "outline"}
                                            className={`justify-start ${vote.my_vote === 'no' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}
                                            onClick={() => handleVote(vote.id, 'no')}
                                            disabled={!!vote.my_vote}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> No
                                        </Button>
                                        <Button
                                            variant={vote.my_vote === 'abstain' ? "default" : "outline"}
                                            className={`justify-start ${vote.my_vote === 'abstain' ? 'bg-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                            onClick={() => handleVote(vote.id, 'abstain')}
                                            disabled={!!vote.my_vote}
                                        >
                                            <Ban className="mr-2 h-4 w-4" /> Abstain
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
                                    <p className="text-sm font-medium mb-3">Current Results ({vote.results.total} votes)</p>

                                    <ResultBar label="Yes" count={vote.results.yes} total={vote.results.total} color="bg-green-500" />
                                    <ResultBar label="No" count={vote.results.no} total={vote.results.total} color="bg-red-500" />
                                    <ResultBar label="Abstain" count={vote.results.abstain} total={vote.results.total} color="bg-gray-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
