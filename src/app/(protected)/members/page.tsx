"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Copy, ShieldCheck, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

import { useState, useEffect } from "react";
import { getPendingJoinRequestsAction, respondToJoinRequestAction, getUnionMembersAction, promoteMemberAction } from "@/lib/union-actions";
import { removeMemberAndRotateKey, createBulkSecureInvites, refreshInviteKey } from "@/lib/client-actions/unions";
import { getUnionInvitesAction, type IssuedInvite } from "@/lib/union-actions";
import { fingerprintFromJson } from "@/lib/key-fingerprint";
import { useUnion } from "@/context/UnionContext";
import { useAuth } from "@/context/AuthContext";
import { Check, X, ShieldAlert, ShieldPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MembersPage() {
    const { activeUnion } = useUnion();
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [memberQuery, setMemberQuery] = useState("");
    type SortKey = 'username' | 'role' | 'joinedAt';
    type SortDir = 'asc' | 'desc';
    const [sortKey, setSortKey] = useState<SortKey>('joinedAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const PAGE_SIZE = 25;
    const [page, setPage] = useState(0);

    const isAdmin = activeUnion?.role === 'admin';

    const filteredMembers = memberQuery.trim()
        ? members.filter(m => m.username?.toLowerCase().includes(memberQuery.trim().toLowerCase()))
        : members;

    const sortedMembers = [...filteredMembers].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'username') return (a.username || '').localeCompare(b.username || '') * dir;
        if (sortKey === 'role') return (a.role || '').localeCompare(b.role || '') * dir;
        // joinedAt
        const at = new Date(a.joinedAt || 0).getTime();
        const bt = new Date(b.joinedAt || 0).getTime();
        return (at - bt) * dir;
    });

    const pageCount = Math.max(1, Math.ceil(sortedMembers.length / PAGE_SIZE));
    // Clamp the page in case filter/sort changes shrink the list.
    const safePage = Math.min(page, pageCount - 1);
    const pagedMembers = sortedMembers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    // Reset to page 0 when the filter or sort changes — the user is asking
    // for a new view of the data, current page index is no longer meaningful.
    useEffect(() => { setPage(0); }, [memberQuery, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            // Sensible defaults per column: newest joins first, A→Z for names.
            setSortDir(key === 'joinedAt' ? 'desc' : 'asc');
        }
    };
    const ariaSortFor = (key: SortKey): 'ascending' | 'descending' | 'none' =>
        sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';

    useEffect(() => {
        if (activeUnion) {
            loadMembers();
            if (isAdmin) loadRequests();
        }
    }, [activeUnion]);

    const loadMembers = async () => {
        if (!activeUnion) return;
        setMembersLoading(true);
        const result = await getUnionMembersAction(activeUnion.id);
        if (result.members) {
            // Compute key fingerprints client-side (H8). Done here rather
            // than on the server so admins can verify the value locally
            // against an out-of-band channel without trusting the server.
            const withFingerprints = await Promise.all(
                result.members.map(async (m: any) => ({
                    ...m,
                    fingerprint: await fingerprintFromJson(m.publicKey),
                }))
            );
            setMembers(withFingerprints);
        }
        setMembersLoading(false);
    };

    const loadRequests = async () => {
        if (!activeUnion) return;
        const { requests: data } = await getPendingJoinRequestsAction(activeUnion.id);
        if (data) setRequests(data);
    };

    const handleRespond = async (requestId: string, accept: boolean) => {
        setRespondingTo(requestId);
        try {
            const { error } = await respondToJoinRequestAction(requestId, accept);
            if (error) toast.error(error);
            else {
                toast.success(accept ? "Member approved" : "Request denied");
                loadRequests();
                if (accept) loadMembers();
            }
        } catch {
            toast.error("Error processing request");
        } finally {
            setRespondingTo(null);
        }
    };

    const handlePromote = async (memberId: string, username: string) => {
        if (!activeUnion) return;
        if (!confirm(`Promote ${username} to admin?`)) return;
        setActionLoading(memberId + '-promote');
        try {
            const result = await promoteMemberAction(activeUnion.id, memberId);
            if (result.error) toast.error(result.error);
            else {
                toast.success(`${username} is now an admin.`);
                loadMembers();
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemove = async (memberId: string, username: string) => {
        if (!activeUnion) return;
        if (!confirm(`Remove ${username} from the union? This will rotate the encryption key.`)) return;
        setActionLoading(memberId + '-remove');
        try {
            await removeMemberAndRotateKey(activeUnion.id, memberId);
            toast.success(`${username} has been removed.`);
            loadMembers();
        } catch (e) {
            toast.error("Failed to remove member");
        } finally {
            setActionLoading(null);
        }
    };

    const copyInviteCode = () => {
        if (!activeUnion?.inviteCode) return;
        navigator.clipboard.writeText(activeUnion.inviteCode)
            .then(() => toast.success("Invite code copied to clipboard"))
            .catch(() => toast.error("Failed to copy — try selecting and copying manually"));
    };

    if (!activeUnion) {
        return <div className="p-8 text-center text-muted-foreground">Select a union to view members.</div>;
    }

    return (
        <ProtectedRoute>
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                        <p className="text-muted-foreground">
                            {membersLoading ? 'Loading...' : `${members.length} member${members.length !== 1 ? 's' : ''}`} in <strong>{activeUnion.name}</strong>
                        </p>
                    </div>
                </div>

                {/* Invite Section — admin-only (invite code grants key escrow access) */}
                {isAdmin && activeUnion.inviteCode && (
                <Card className="mb-8 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserPlus className="h-5 w-5" /> Invite Members
                        </CardTitle>
                        <CardDescription>
                            Generate a secure invite link to share with coworkers. The link grants
                            immediate access to encrypted history — share only with people you trust.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InvitationsPanel unionId={activeUnion.id} />
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                                Invite code (advanced)
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded border font-mono text-sm">
                                    <span className="truncate">{activeUnion.inviteCode}</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={copyInviteCode} title="Copy invite code">
                                    <Copy className="h-4 w-4 mr-1" /> Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Existing members can paste this in <strong>Unions &rsaquo; Join Union</strong>.
                            </p>
                        </div>
                        <RefreshInviteKeyButton unionId={activeUnion.id} />
                    </CardContent>
                </Card>
                )}

                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Member List
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="requests" className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" />
                                Join Requests
                                {requests.length > 0 && (
                                    <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                        {requests.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="list">
                        {!membersLoading && members.length > 8 && (
                            <div className="mb-3">
                                <input
                                    type="search"
                                    value={memberQuery}
                                    onChange={(e) => setMemberQuery(e.target.value)}
                                    placeholder={`Filter ${members.length} members by username…`}
                                    aria-label="Filter members"
                                    className="flex h-9 w-full sm:w-72 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        )}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            {membersLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sortedMembers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {memberQuery.trim() ? `No members match "${memberQuery}".` : 'No members found.'}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th scope="col" aria-sort={ariaSortFor('username')} className="p-4 font-medium">
                                                <SortHeader label="Username" active={sortKey === 'username'} dir={sortDir} onClick={() => toggleSort('username')} />
                                            </th>
                                            <th scope="col" aria-sort={ariaSortFor('role')} className="p-4 font-medium">
                                                <SortHeader label="Role" active={sortKey === 'role'} dir={sortDir} onClick={() => toggleSort('role')} />
                                            </th>
                                            <th scope="col" aria-sort={ariaSortFor('joinedAt')} className="p-4 font-medium hidden md:table-cell">
                                                <SortHeader label="Joined" active={sortKey === 'joinedAt'} dir={sortDir} onClick={() => toggleSort('joinedAt')} />
                                            </th>
                                            {isAdmin && <th scope="col" className="p-4 font-medium text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedMembers.map((member: any) => {
                                            const isPromoting = actionLoading === member.id + '-promote';
                                            const isRemoving = actionLoading === member.id + '-remove';
                                            const isSelf = member.id === user?.uid;

                                            return (
                                                <tr key={member.id} className="border-b last:border-0">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                                                {member.username.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">{member.username}</span>
                                                                {isSelf && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                                                                {member.fingerprint && (
                                                                    <div
                                                                        className="text-[10px] font-mono text-muted-foreground mt-0.5"
                                                                        title="Key fingerprint — verify out-of-band with this member to confirm no MITM."
                                                                    >
                                                                        🔑 {member.fingerprint}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            member.role === 'admin'
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                                                        {new Date(member.joinedAt).toLocaleDateString()}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="p-4 text-right">
                                                            {!isSelf && (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {member.role !== 'admin' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handlePromote(member.id, member.username)}
                                                                            disabled={isPromoting}
                                                                            title={`Promote ${member.username} to admin`}
                                                                            aria-label={`Promote ${member.username} to admin`}
                                                                        >
                                                                            {isPromoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-destructive hover:text-destructive"
                                                                        onClick={() => handleRemove(member.id, member.username)}
                                                                        disabled={isRemoving}
                                                                        title={`Remove ${member.username}`}
                                                                        aria-label={`Remove ${member.username}`}
                                                                    >
                                                                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                            {!membersLoading && sortedMembers.length > PAGE_SIZE && (
                                <div className="flex items-center justify-between gap-3 p-4 border-t text-sm">
                                    <span className="text-muted-foreground">
                                        Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sortedMembers.length)} of {sortedMembers.length}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={safePage === 0}
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            aria-label="Previous page"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-muted-foreground tabular-nums">
                                            Page {safePage + 1} of {pageCount}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={safePage >= pageCount - 1}
                                            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                                            aria-label="Next page"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="requests">
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                                <h3 className="font-semibold mb-4">Pending Requests</h3>
                                {requests.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No pending requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {requests.map(req => {
                                            const isResponding = respondingTo === req.id;
                                            return (
                                                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                                            {(req.user?.username || "??").substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{req.user?.username || "Unknown User"}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Requested {new Date(req.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRespond(req.id, false)}
                                                            disabled={isResponding}
                                                        >
                                                            {isResponding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                                            Deny
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleRespond(req.id, true)}
                                                            disabled={isResponding}
                                                        >
                                                            {isResponding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}

function SortHeader({
    label, active, dir, onClick,
}: {
    label: string;
    active: boolean;
    dir: 'asc' | 'desc';
    onClick: () => void;
}) {
    const Icon = !active ? ChevronsUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 -ml-1 px-1 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
            {label}
            <Icon className="h-3 w-3" aria-hidden="true" />
        </button>
    );
}

function InvitationsPanel({ unionId }: { unionId: string }) {
    // Labels textarea: one recipient per line. Single-recipient flow is just
    // "one line in the box" — no separate UI for it.
    const [labelsInput, setLabelsInput] = useState("");
    const [creating, setCreating] = useState(false);
    // Links freshly minted this session, kept in memory because the
    // private key fragment is only embedded in the URL we hand back and is
    // never returned by getUnionInvitesAction (it's not on the server).
    const [freshlyMinted, setFreshlyMinted] = useState<{ label: string; url: string }[]>([]);
    const [invites, setInvites] = useState<IssuedInvite[] | null>(null);

    const loadInvites = async () => {
        const res = await getUnionInvitesAction(unionId);
        setInvites(res.invites ?? []);
    };

    useEffect(() => {
        loadInvites();
        // Quick poll while the panel is open so an admin who's actively
        // sending invites sees the ledger flip to "joined" without manual
        // refresh. Cheap — admin-only screen, small queries.
        const t = setInterval(loadInvites, 20_000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unionId]);

    const handleGenerate = async () => {
        const labels = labelsInput
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean);
        if (labels.length === 0) {
            toast.error("Add at least one recipient label (one per line).");
            return;
        }
        if (labels.length > 50) {
            toast.error("Generate at most 50 invites at a time.");
            return;
        }
        setCreating(true);
        try {
            const issued = await createBulkSecureInvites(unionId, labels);
            setFreshlyMinted(prev => [...issued, ...prev]);
            setLabelsInput("");
            toast.success(`${issued.length} invite${issued.length === 1 ? '' : 's'} generated.`);
            loadInvites();
        } catch (e) {
            toast.error(`Failed: ${e instanceof Error ? e.message : 'unknown error'}`);
        } finally {
            setCreating(false);
        }
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success("Link copied"))
            .catch(() => toast.error("Could not copy — select and copy manually"));
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="invite-labels" className="block text-sm font-medium mb-1">
                    Generate invite links
                </label>
                <textarea
                    id="invite-labels"
                    rows={3}
                    placeholder={"One recipient label per line\ne.g.\nMaria (accounting)\nDay-shift crew"}
                    className="w-full p-2 border rounded text-sm font-mono"
                    value={labelsInput}
                    onChange={e => setLabelsInput(e.target.value)}
                    aria-describedby="invite-labels-help"
                />
                <p id="invite-labels-help" className="text-xs text-muted-foreground mt-1">
                    Labels are visible only to admins of this union. Each label produces one Secure Invite Link with the union&apos;s encryption key bundled in.
                </p>
                <Button onClick={handleGenerate} disabled={creating} className="mt-2">
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Generate
                </Button>
            </div>

            {freshlyMinted.length > 0 && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium">
                            Copy these links and send them now — the private key in each URL is not stored on the server and can&apos;t be recovered if you lose it.
                        </p>
                        <button
                            type="button"
                            onClick={() => setFreshlyMinted([])}
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                        >
                            Dismiss
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {freshlyMinted.map((item, i) => (
                            <div key={`${item.url}-${i}`} className="flex gap-2 items-center">
                                <span className="text-xs font-medium w-32 truncate shrink-0" title={item.label}>{item.label}</span>
                                <input
                                    readOnly
                                    value={item.url}
                                    onFocus={(e) => e.currentTarget.select()}
                                    className="flex-1 min-w-0 bg-background border rounded px-2 py-1 text-[11px] truncate font-mono"
                                    aria-label={`Invite link for ${item.label}`}
                                />
                                <Button size="sm" variant="outline" onClick={() => copy(item.url)}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Issued invites</h4>
                    <button
                        type="button"
                        onClick={loadInvites}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Refresh
                    </button>
                </div>
                {invites === null ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : invites.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No invites yet. Generate one above.</p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {invites.map((inv) => (
                            <li key={inv.id} className="px-3 py-2 flex items-center justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                    <div className="truncate">
                                        {inv.label || <span className="text-muted-foreground italic">(no label)</span>}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Sent {new Date(inv.createdAt).toLocaleString()}
                                        {inv.status === 'joined' && inv.consumedAt && (
                                            <> · Joined {inv.consumedByUsername ? `as ${inv.consumedByUsername} ` : ''}{new Date(inv.consumedAt).toLocaleString()}</>
                                        )}
                                    </div>
                                </div>
                                <span className={
                                    inv.status === 'joined'
                                        ? 'text-[10px] uppercase font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0'
                                        : inv.status === 'expired'
                                            ? 'text-[10px] uppercase font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0'
                                            : 'text-[10px] uppercase font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0'
                                }>
                                    {inv.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function RefreshInviteKeyButton({ unionId }: { unionId: string }) {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await refreshInviteKey(unionId);
            toast.success("Invite key updated. New members joining with the invite code will receive the encryption key.");
            setDone(true);
        } catch (e) {
            toast.error("Failed to refresh invite key: " + e);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="text-xs text-center text-emerald-600 font-medium py-1">
                Invite key up to date
            </div>
        );
    }

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 rounded border border-dashed hover:border-solid transition-all flex items-center justify-center gap-1 disabled:opacity-50"
        >
            {loading ? "Updating..." : "Refresh Invite Key"}
        </button>
    );
}
