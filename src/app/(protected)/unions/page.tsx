"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, Users, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    createUnion,
    joinUnion,
    getUserUnions,
    requestAlliance,
    getAlliedUnions,
    getUnion,
    Union
} from "@/services/unionService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useUnion } from "@/context/UnionContext";

export default function UnionsPage() {
    const { user } = useAuth();
    const { unions, refreshUnions, setActiveUnion } = useUnion();
    const [alliedUnions, setAlliedUnions] = useState<Union[]>([]);
    // loading is handled by UnionContext for unions, but we might want local loading for actions
    const [actionLoading, setActionLoading] = useState(false);

    // Form States
    const [joinCode, setJoinCode] = useState("");
    const [createName, setCreateName] = useState("");
    const [allianceCode, setAllianceCode] = useState("");
    const [selectedUnionId, setSelectedUnionId] = useState("");

    useEffect(() => {
        if (unions.length > 0) {
            setSelectedUnionId(unions[0].id);
            loadAllies(unions[0].id);
        }
    }, [unions]);

    const loadAllies = async (unionId: string) => {
        try {
            const allies = await getAlliedUnions(unionId);
            setAlliedUnions(allies);
        } catch (error) {
            console.error("Failed to load allies", error);
        }
    };

    const handleCreate = async () => {
        if (!createName || !user) return;
        setActionLoading(true);
        try {
            const newUnionId = await createUnion(createName, user.uid);
            setCreateName("");
            alert("Union created!");
            await refreshUnions();
            // Force set active union to the new one
            const newUnion = await getUnion(newUnionId);
            if (newUnion) setActiveUnion(newUnion);
        } catch (error) {
            alert("Error creating union: " + error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode || !user) return;
        setActionLoading(true);
        try {
            const newUnionId = await joinUnion(joinCode, user.uid);
            setJoinCode("");
            alert("Joined union!");
            await refreshUnions();
            // Force set active union to the new one
            const newUnion = await getUnion(newUnionId);
            if (newUnion) setActiveUnion(newUnion);
        } catch (error) {
            alert("Error joining union: " + error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestAlliance = async () => {
        if (!allianceCode || !selectedUnionId) return;
        try {
            await requestAlliance(selectedUnionId, allianceCode);
            setAllianceCode("");
            alert("Alliance request sent!");
        } catch (error) {
            alert("Error requesting alliance: " + error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-4 md:p-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Unions</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Manage your union memberships and alliances.</p>
                    </div>
                </div>

                <Tabs defaultValue="my-unions" className="w-full">
                    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:px-0 md:mx-0">
                        <TabsList className="mb-6 md:mb-8 inline-flex w-auto min-w-full md:min-w-0 justify-start">
                            <TabsTrigger value="my-unions" className="whitespace-nowrap">My Unions</TabsTrigger>
                            <TabsTrigger value="join" className="whitespace-nowrap">Join Union</TabsTrigger>
                            <TabsTrigger value="create" className="whitespace-nowrap">Create Union</TabsTrigger>
                            <TabsTrigger value="discover" className="whitespace-nowrap">Discover Unions</TabsTrigger>
                            <TabsTrigger value="allied" className="whitespace-nowrap">Allied Unions</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="my-unions">
                        {/* ... existing my-unions content ... */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {unions.map(union => (
                                <div key={union.id} className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {union.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{union.name}</h3>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Users className="mr-1 h-3 w-3" />
                                                {union.members.length} members
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                                        <code className="text-sm font-mono">{union.inviteCode}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(union.inviteCode)}
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="join">
                        {/* ... existing join content ... */}
                        <div className="max-w-md mx-auto mt-12 p-6 border rounded-xl bg-card">
                            <h3 className="text-lg font-semibold mb-4">Join an Existing Union</h3>
                            <div className="space-y-4">
                                <input
                                    placeholder="Enter Invite Code (e.g. UN-XXXX)"
                                    className="w-full p-2 border rounded-md"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                                <button
                                    onClick={handleJoin}
                                    className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90"
                                >
                                    Join Union
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="create">
                        {/* ... existing create content ... */}
                        <div className="max-w-md mx-auto mt-12 p-6 border rounded-xl bg-card">
                            <h3 className="text-lg font-semibold mb-4">Create a New Union</h3>
                            <div className="space-y-4">
                                <input
                                    placeholder="Union Name"
                                    className="w-full p-2 border rounded-md"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                />
                                <button
                                    onClick={handleCreate}
                                    className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90"
                                >
                                    Create Union
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="discover">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="p-6 border rounded-xl bg-card">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <ArrowRightLeft className="h-5 w-5" />
                                    Request Alliance
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Connect with other unions to coordinate actions.
                                </p>
                                <div className="space-y-4">
                                    <select
                                        value={selectedUnionId}
                                        onChange={(e) => {
                                            setSelectedUnionId(e.target.value);
                                            loadAllies(e.target.value);
                                        }}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <input
                                        placeholder="Target Union Invite Code"
                                        className="w-full p-2 border rounded-md"
                                        value={allianceCode}
                                        onChange={(e) => setAllianceCode(e.target.value)}
                                    />
                                    <button
                                        onClick={handleRequestAlliance}
                                        className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90"
                                    >
                                        Send Alliance Request
                                    </button>
                                </div>
                            </div>

                            {/* Placeholder for future Discovery features (Map/Industry List) */}
                        </div>
                    </TabsContent>

                    <TabsContent value="allied">
                        <div className="max-w-4xl mx-auto">
                            <h3 className="text-lg font-semibold mb-4">Allied Unions</h3>
                            {alliedUnions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-muted-foreground">No alliances yet.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {alliedUnions.map(ally => (
                                        <div key={ally.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                                    {ally.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{ally.name}</div>
                                                    <div className="text-xs text-muted-foreground">Ally</div>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                                Active
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}
