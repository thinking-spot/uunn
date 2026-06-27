'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { validate, createVoteInput, uuid, encryptedPayload, iv as ivSchema } from '@/lib/validation';
import { verifyMembership } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import type { VoteRawData, VoteResponseRaw } from '@/lib/types';
import { logError } from '@/lib/log';

// Plaintext placeholders written into the legacy NOT NULL `title` and
// `description` columns. The real values live in the *_blob/*_iv columns
// the client encrypts — these constants exist only to keep the schema
// happy until those columns are made nullable.
const VOTE_TITLE_PLACEHOLDER = 'Encrypted Vote';
const VOTE_DESC_PLACEHOLDER = '';

export async function createVoteAction(
    unionId: string,
    titleBlob: string,
    titleIv: string,
    documentIds: string[] = [],
    id?: string,
    descriptionBlob?: string,
    descriptionIv?: string,
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const uV = validate(uuid, unionId);
    if ('error' in uV) return { error: uV.error };
    const tbV = validate(encryptedPayload, titleBlob);
    if ('error' in tbV) return { error: tbV.error };
    const tivV = validate(ivSchema, titleIv);
    if ('error' in tivV) return { error: tivV.error };
    const docsV = validate(createVoteInput.shape.documentIds, documentIds);
    if ('error' in docsV) return { error: docsV.error };
    if (id !== undefined) {
        const idV = validate(uuid, id);
        if ('error' in idV) return { error: idV.error };
    }
    if (descriptionBlob !== undefined) {
        const dbV = validate(encryptedPayload, descriptionBlob);
        if ('error' in dbV) return { error: dbV.error };
        const divV = validate(ivSchema, descriptionIv ?? '');
        if ('error' in divV) return { error: divV.error };
    }

    const { allowed: createAllowed } = rateLimit(`vote-create:${session.user.id}`, 10, 60_000);
    if (!createAllowed) return { error: "Slow down — too many votes created in the last minute." };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const insertRow: Record<string, unknown> = {
        union_id: unionId,
        created_by: session.user.id,
        title: VOTE_TITLE_PLACEHOLDER,
        description: VOTE_DESC_PLACEHOLDER,
        vote_type: 'yes_no',
        title_blob: titleBlob,
        title_iv: titleIv,
    };
    if (id) insertRow.id = id;
    if (descriptionBlob !== undefined) {
        insertRow.description_blob = descriptionBlob;
        insertRow.description_iv = descriptionIv;
    }

    // 1. Create Vote
    const { data: vote, error } = await supabaseAdmin
        .from('Votes')
        .insert(insertRow)
        .select()
        .single();

    if (error) {
        logError('createVote failed', error);
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
            logError('createVote attachments failed', attachError);
            // Non-fatal, return success with warning? Or just log.
        }
    }

    return { success: true, vote };
}

/**
 * Fetch votes for a union along with raw (encrypted) response payloads.
 *
 * The server no longer aggregates choice counts or surfaces the caller's
 * vote — those are now derived client-side from the per-row `choice_blob`
 * after the client decrypts each response with the union AES-GCM key.
 *
 * Legacy plaintext rows (created before migration 0011) carry a populated
 * `choice` column and a NULL blob/iv; the client treats them transparently.
 */
export async function getUnionVotesAction(unionId: string): Promise<{ votes?: VoteRawData[], error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    if (!await verifyMembership(unionId, session.user.id)) {
        return { error: "Not authorized — members only" };
    }

    const { data: votes, error } = await supabaseAdmin
        .from('Votes')
        .select(`
            *,
            creator:Users!created_by (username),
            attachments:VoteAttachments (
                document:Documents (id, title, title_blob, title_iv, union_id)
            )
        `)
        .eq('union_id', unionId)
        .order('created_at', { ascending: false });

    if (error) return { error: "Failed to fetch votes" };

    const voteIds = votes.map(v => v.id);

    const { data: allResponses } = voteIds.length > 0
        ? await supabaseAdmin
            .from('VoteResponses')
            .select('vote_id, user_id, choice, choice_blob, iv')
            .in('vote_id', voteIds)
        : { data: [] as VoteResponseRaw[] };

    const responsesByVote = new Map<string, VoteResponseRaw[]>();
    (allResponses || []).forEach((r: any) => {
        const list = responsesByVote.get(r.vote_id) || [];
        list.push({
            user_id: r.user_id,
            choice: r.choice ?? null,
            choice_blob: r.choice_blob ?? null,
            iv: r.iv ?? null,
        });
        responsesByVote.set(r.vote_id, list);
    });

    const finalVotes: VoteRawData[] = votes.map((v: any) => ({
        id: v.id,
        union_id: v.union_id,
        title: v.title,
        title_blob: v.title_blob ?? null,
        title_iv: v.title_iv ?? null,
        description: v.description,
        description_blob: v.description_blob ?? null,
        description_iv: v.description_iv ?? null,
        status: v.status,
        vote_type: v.vote_type,
        created_at: v.created_at,
        created_by: v.created_by,
        created_by_name: v.creator?.username || 'Unknown',
        attached_documents: (v.attachments || [])
            .map((a: any) => a.document)
            .filter(Boolean)
            .map((d: any) => ({
                id: d.id,
                title: d.title,
                title_blob: d.title_blob ?? null,
                title_iv: d.title_iv ?? null,
                union_id: d.union_id,
            })),
        responses: responsesByVote.get(v.id) || [],
    }));

    return { votes: finalVotes };
}

/**
 * Cast an encrypted vote. The plaintext choice never reaches the server;
 * the client passes a ciphertext + IV produced by encrypting the choice
 * with the union's AES-GCM key.
 */
export async function castVoteAction(voteId: string, choiceBlob: string, iv: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const vv = validate(uuid, voteId);
    if ('error' in vv) return { error: vv.error };
    const bv = validate(encryptedPayload, choiceBlob);
    if ('error' in bv) return { error: bv.error };
    const iv2 = validate(ivSchema, iv);
    if ('error' in iv2) return { error: iv2.error };

    // Throttle cast attempts to defend against retry storms / scripted clicks.
    // The already-voted check below also prevents double-counting, but the rate
    // limit short-circuits before the DB does any work.
    const { allowed } = rateLimit(`vote-cast:${session.user.id}`, 30, 60_000);
    if (!allowed) return { error: "Slow down — too many cast attempts in the last minute." };

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
        .select('user_id')
        .eq('vote_id', voteId)
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (existing) return { error: "Already voted" };

    const { error } = await supabaseAdmin
        .from('VoteResponses')
        .insert({
            vote_id: voteId,
            user_id: session.user.id,
            // `choice` left NULL: the encrypted blob is the source of truth.
            choice: null,
            choice_blob: choiceBlob,
            iv,
        });

    if (error) {
        logError('castVote failed', error);
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
        logError('closeVote failed', error);
        return { error: "Failed to close vote" };
    }
    return { success: true };
}
