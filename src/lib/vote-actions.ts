'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { validate, createVoteInput, uuid } from '@/lib/validation';
import { z } from 'zod';
import { verifyMembership } from '@/lib/auth-helpers';
import type { VoteData } from '@/lib/types';

export async function createVoteAction(unionId: string, title: string, description: string, documentIds: string[] = []) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const v = validate(createVoteInput, { unionId, title, description, documentIds });
    if ('error' in v) return { error: v.error };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

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
        return { error: "Failed to create vote" };
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

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    // 1. Fetch Votes with Attachments and Creator
    const { data: votes, error } = await supabaseAdmin
        .from('Votes')
        .select(`
            *,
            creator:Users!created_by (username),
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
    const userId = session.user.id;

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
        if (r.user_id === userId) {
            myVoteMap.set(r.vote_id, r.choice);
        }
    });

    // 4. Combine
    const finalVotes: VoteData[] = votes.map(v => ({
        ...v,
        created_by_name: (v as any).creator?.username || 'Unknown',
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

    const vv = validate(uuid, voteId);
    if ('error' in vv) return { error: vv.error };
    const cv = validate(z.enum(['yes', 'no', 'abstain']), choice);
    if ('error' in cv) return { error: cv.error };

    // Verify membership via the vote's union
    const { data: vote } = await supabaseAdmin
        .from('Votes')
        .select('union_id, status')
        .eq('id', voteId)
        .single();
    if (!vote) return { error: "Vote not found" };

    if (vote.status === 'closed') return { error: "This vote is closed" };

    if (!await verifyMembership(vote.union_id, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

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

export async function closeVoteAction(voteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const vv = validate(uuid, voteId);
    if ('error' in vv) return { error: vv.error };

    const { data: vote } = await supabaseAdmin
        .from('Votes')
        .select('union_id, created_by, status')
        .eq('id', voteId)
        .single();

    if (!vote) return { error: "Vote not found" };
    if (vote.status === 'closed') return { error: "Vote is already closed" };
    if (vote.created_by !== session.user.id) return { error: "Only the vote creator can close it" };

    if (!await verifyMembership(vote.union_id, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { error } = await supabaseAdmin
        .from('Votes')
        .update({ status: 'closed' })
        .eq('id', voteId);

    if (error) {
        console.error("Close Vote Error:", error);
        return { error: "Failed to close vote" };
    }
    return { success: true };
}
