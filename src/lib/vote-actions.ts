'use server';

import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

export type VoteData = {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'closed';
    vote_type: 'yes_no' | 'multiple_choice';
    created_at: string;
    created_by: string;
    my_vote?: string; // What the current user voted
    results: {
        yes: number;
        no: number;
        abstain: number;
        total: number;
    };
};

export async function createVoteAction(unionId: string, title: string, description: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from('Votes')
        .insert({
            union_id: unionId,
            created_by: session.user.id,
            title,
            description,
            vote_type: 'yes_no' // MVP restricted to yes_no
        })
        .select()
        .single();

    if (error) {
        console.error("Create Vote Error:", error);
        return { error: "Failed to create vote" };
    }
    return { success: true, vote: data };
}

export async function getUnionVotesAction(unionId: string): Promise<{ votes?: VoteData[], error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // 1. Fetch Votes
    const { data: votes, error } = await supabase
        .from('Votes')
        .select('*')
        .eq('union_id', unionId)
        .order('created_at', { ascending: false });

    if (error) return { error: "Failed to fetch votes" };

    // 2. Fetch User's Votes (to show what they selected)
    const { data: myResponses } = await supabase
        .from('VoteResponses')
        .select('vote_id, choice')
        .eq('user_id', session.user.id)
        .in('vote_id', votes.map(v => v.id));

    const myVoteMap = new Map(myResponses?.map(r => [r.vote_id, r.choice]));

    // 3. Fetch Aggregate Results (This is heavy for MVP, maybe optimize later with a View or RPC)
    // For now, we do a separate query or just fetch ALL responses if scale is small.
    // Better: Helper RPC or `.select('choice', { count: 'exact' })`... wait, group by is hard in simple client.
    // Let's just select ALL responses for these votes. MVP scale < 1000 votes usually.
    // Optimization: Create a Database View `vote_results` that pre-aggregates.
    // For now, I'll fetch raw responses for precision or correct logic.
    const { data: allResponses } = await supabase
        .from('VoteResponses')
        .select('vote_id, choice')
        .in('vote_id', votes.map(v => v.id));

    // Aggregate in JS
    const resultsMap = new Map<string, { yes: number, no: number, abstain: number, total: number }>();

    votes.forEach(v => {
        resultsMap.set(v.id, { yes: 0, no: 0, abstain: 0, total: 0 });
    });

    allResponses?.forEach(r => {
        const stats = resultsMap.get(r.vote_id);
        if (stats) {
            stats.total++;
            if (r.choice === 'yes') stats.yes++;
            else if (r.choice === 'no') stats.no++;
            else if (r.choice === 'abstain') stats.abstain++;
        }
    });

    // 4. Combine
    const finalVotes: VoteData[] = votes.map(v => ({
        ...v,
        my_vote: myVoteMap.get(v.id),
        results: resultsMap.get(v.id) || { yes: 0, no: 0, abstain: 0, total: 0 }
    }));

    return { votes: finalVotes };
}

export async function castVoteAction(voteId: string, choice: 'yes' | 'no' | 'abstain') {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const { error } = await supabase
        .from('VoteResponses')
        .insert({
            vote_id: voteId,
            user_id: session.user.id,
            choice
        });

    if (error) {
        // Check for unique violation
        if (error.code === '23505') return { error: "You have already voted." };
        console.error("Cast Vote Error:", error);
        return { error: "Failed to cast vote." };
    }

    return { success: true };
}
