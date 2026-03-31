"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Copy, Link as LinkIcon } from "lucide-react";

import { useState, useEffect } from "react";
import { getPendingJoinRequestsAction, respondToJoinRequestAction, getUnionMembersAction, promoteMemberAction } from "@/lib/union-actions";
import { removeMemberAndRotateKey, createSecureInvite } from "@/lib/client-actions/unions";
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
    const [generatingLink, setGeneratingLink] = useState(false);

    const isAdmin = activeUnion?.role === 'admin';

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
        if (result.members) setMembers(result.members);
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
        navigator.clipboard.writeText(activeUnion.inviteCode);
        toast.success("Invite code copied to clipboard");
    };

    const copyInviteLink = () => {
        if (!activeUnion?.inviteCode) return;
        const link = `${window.location.origin}/join/${activeUnion.inviteCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Invite link copied to clipboard");
    };

    const generateSecureLink = async () => {
        if (!activeUnion) return;
        setGeneratingLink(true);
        try {
            const link = await createSecureInvite(activeUnion.id);
            navigator.clipboard.writeText(link);
            toast.success("Secure invite link copied to clipboard");
        } catch {
            toast.error("Failed to generate secure link");
        } finally {
            setGeneratingLink(false);
        }
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

                {/* Invite Section */}
                <Card className="mb-8 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserPlus className="h-5 w-5" /> Invite Members
                        </CardTitle>
                        <CardDescription>Share the invite code or link with coworkers to grow your union.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded border font-mono text-sm">
                                <span className="truncate">{activeUnion.inviteCode}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyInviteCode} title="Copy invite code">
                                <Copy className="h-4 w-4 mr-1" /> Code
                            </Button>
                            <Button variant="outline" size="sm" onClick={copyInviteLink} title="Copy invite link">
                                <LinkIcon className="h-4 w-4 mr-1" /> Link
                            </Button>
                        </div>
                        {isAdmin && (
                            <div>
                                <Button variant="outline" size="sm" onClick={generateSecureLink} disabled={generatingLink}>
                                    {generatingLink ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-1" />}
                                    Generate Secure Invite Link
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Secure links grant immediate access to encrypted history. Share only with trusted members.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            {membersLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : members.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No members found.</div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="p-4 font-medium">Username</th>
                                            <th className="p-4 font-medium">Role</th>
                                            <th className="p-4 font-medium hidden md:table-cell">Joined</th>
                                            {isAdmin && <th className="p-4 font-medium text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member: any) => {
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
                                                                            title="Promote to admin"
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
                                                                        title="Remove member"
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
