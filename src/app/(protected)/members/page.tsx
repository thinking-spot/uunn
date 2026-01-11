"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Users, Network } from "lucide-react";

export default function MembersPage() {
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
                        <TabsTrigger value="graph" className="flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Invitation Graph
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground">
                            <p>Member list table will appear here.</p>
                            <div className="mt-4 flex gap-2 justify-center text-xs">
                                <span className="px-2 py-1 bg-muted rounded">Display Name</span>
                                <span className="px-2 py-1 bg-muted rounded">Role</span>
                                <span className="px-2 py-1 bg-muted rounded">Tier</span>
                                <span className="px-2 py-1 bg-muted rounded">Join Date</span>
                            </div>
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
