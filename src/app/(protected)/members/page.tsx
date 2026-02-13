"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Users, Network } from "lucide-react";

import { useState, useEffect } from "react";
import { getPendingJoinRequestsAction, respondToJoinRequestAction } from "@/lib/union-actions";
import { useUnion } from "@/context/UnionContext";
import { Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MembersPage() {
    const { activeUnion } = useUnion();
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (activeUnion) {
            loadRequests();
        }
    }, [activeUnion]);

    const loadRequests = async () => {
        if (!activeUnion) return;
        const { requests: data } = await getPendingJoinRequestsAction(activeUnion.id);
        if (data) setRequests(data);
    };

    const handleRespond = async (requestId: string, accept: boolean) => {
        const { error } = await respondToJoinRequestAction(requestId, accept);
        if (error) alert(error);
        else {
            loadRequests(); // Refresh
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                        <p className="text-muted-foreground">Union membership roster and network.</p>
                    </div>
                </div>

                <Tabs defaultValue="list" className="w-full">
                    <TabsList className="mb-8">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Member List
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            Join Requests
                            {requests.length > 0 && (
                                <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                    {requests.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="graph" className="flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Invitation Graph
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground">
                            <p>Member list table will appear here.</p>
                            {/* Placeholder for future member list implementation */}
                            <div className="mt-4 flex gap-2 justify-center text-xs">
                                <span className="px-2 py-1 bg-muted rounded">Display Name</span>
                                <span className="px-2 py-1 bg-muted rounded">Role</span>
                                <span className="px-2 py-1 bg-muted rounded">Tier</span>
                                <span className="px-2 py-1 bg-muted rounded">Join Date</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="requests">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold mb-4">Pending Requests</h3>
                            {requests.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No pending requests.</p>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{req.user?.username || "Unknown User"}</p>
                                                <p className="text-xs text-muted-foreground">Requested: {new Date(req.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleRespond(req.id, false)}>
                                                    <X className="h-4 w-4 mr-1" /> Deny
                                                </Button>
                                                <Button size="sm" onClick={() => handleRespond(req.id, true)}>
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="graph">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-[400px] flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Trust network visualization will appear here.</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}
