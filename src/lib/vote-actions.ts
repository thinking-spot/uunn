'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
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
    attached_documents?: { id: string, title: string }[];
    results: {
        yes: number;
        no: number;
        abstain: number;
        total: number;
    };
};

export async function createVoteAction(unionId: string, title: string, description: string, documentIds: string[] = []) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    console.log("Creating vote:", { unionId, userId: session.user.id, title });

    // 1. Create Vote
    const { data: vote, error } = await supabaseAdmin
        .from('Votes')
        .insert({
            union_id: unionId,
            created_by: session.user.id,
            title,
            description,
            vote_type: 'yes_no'
        })
        .select()
        .single();

    if (error) {
        console.error("Create Vote Error:", error);
        // Clean error message
        return { error: `Failed to create vote: ${error.message}` };
    }

    // 2. Attach Documents
    if (documentIds.length > 0) {
        const attachments = documentIds.map(docId => ({
            vote_id: vote.id,
            document_id: docId
        }));

        const { error: attachError } = await supabaseAdmin
            .from('VoteAttachments')
            .insert(attachments);

        if (attachError) {
            console.error("Attachment Error:", attachError);
            // Non-fatal, return success with warning? Or just log.
        }
    }

    return { success: true, vote };
}

export async function getUnionVotesAction(unionId: string): Promise<{ votes?: VoteData[], error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // 1. Fetch Votes with Attachments
    const { data: votes, error } = await supabaseAdmin
        .from('Votes')
        .select(`
            *,
            attachments:VoteAttachments (
                document:Documents (id, title)
            )
        `)
        .eq('union_id', unionId)
        .order('created_at', { ascending: false });

    if (error) return { error: "Failed to fetch votes" };

    const voteIds = votes.map(v => v.id);

    // 2. Fetch All Responses (for aggregation)
    const { data: allResponses } = await supabaseAdmin
        .from('VoteResponses')
        .select('vote_id, choice, user_id')
        .in('vote_id', voteIds);

    // 3. Aggregate Results & Find My Vote
    const resultsMap = new Map<string, { yes: number, no: number, abstain: number, total: number }>();
    const myVoteMap = new Map<string, string>(); // vote_id -> choice

    votes.forEach(v => {
        resultsMap.set(v.id, { yes: 0, no: 0, abstain: 0, total: 0 });
    });

    allResponses?.forEach(r => {
        // Aggregate
        const stats = resultsMap.get(r.vote_id);
        if (stats) {
            stats.total++;
            if (r.choice === 'yes') stats.yes++;
            else if (r.choice === 'no') stats.no++;
            else if (r.choice === 'abstain') stats.abstain++;
        }

        // Check if it's my vote
        if (r.user_id === session.user.id) {
            myVoteMap.set(r.vote_id, r.choice);
        }
    });

    // 4. Combine
    const finalVotes: VoteData[] = votes.map(v => ({
        ...v,
        my_vote: myVoteMap.get(v.id),
        results: resultsMap.get(v.id) || { yes: 0, no: 0, abstain: 0, total: 0 },
        // @ts-ignore
        attached_documents: v.attachments?.map((a: any) => a.document) || []
    }));

    return { votes: finalVotes };
}

export async function castVoteAction(voteId: string, choice: 'yes' | 'no' | 'abstain') {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Check if already voted
    const { data: existing } = await supabaseAdmin
        .from('VoteResponses')
        .select('id')
        .eq('vote_id', voteId)
        .eq('user_id', session.user.id)
        .single();

    if (existing) return { error: "Already voted" };

    const { error } = await supabaseAdmin
        .from('VoteResponses')
        .insert({
            vote_id: voteId,
            user_id: session.user.id,
            choice
        });

    if (error) {
        console.error("Cast Vote Error:", error);
        return { error: "Failed to cast vote" };
    }
    return { success: true };
}
