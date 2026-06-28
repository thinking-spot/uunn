import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { logError } from '@/lib/log';

export type ActivityKind =
    | 'member_joined'
    | 'member_removed'
    | 'member_promoted'
    | 'vote_opened'
    | 'vote_closed'
    | 'document_created'
    | 'alliance_accepted'
    | 'alliance_dissolved';

/**
 * Record a non-sensitive event into the per-union activity log.
 *
 * Best-effort: failures are logged but never propagated to the caller —
 * we don't want a failed audit insert to break the action that triggered
 * it (e.g. accepting a member, opening a vote). Read by members of the
 * union via getUnionActivityAction.
 */
export async function recordActivity(params: {
    unionId: string;
    actorId: string | null;
    kind: ActivityKind;
    targetId?: string | null;
    targetLabel?: string | null;
}): Promise<void> {
    try {
        const { error } = await supabaseAdmin.from('UnionActivity').insert({
            union_id: params.unionId,
            actor_id: params.actorId,
            kind: params.kind,
            target_id: params.targetId ?? null,
            target_label: params.targetLabel ?? null,
        });
        if (error) logError(`recordActivity[${params.kind}] failed`, error);
    } catch (e) {
        logError(`recordActivity[${params.kind}] threw`, e);
    }
}
