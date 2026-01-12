"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, Users, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    searchUnionsAction,
    requestJoinUnionAction,
    getPendingAllianceRequestsAction,
    respondToAllianceRequestAction
} from "@/lib/union-actions"; // Direct server actions
import {
    createUnion,
    joinUnion,
    getUserUnions,
    requestAlliance,
    getAlliedUnions,
    getUnion,
    createSecureInvite,
    Union
} from "@/lib/client-actions/unions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useUnion } from "@/context/UnionContext";

export default function UnionsPage() {
    const { user } = useAuth();
    const { unions, activeUnion, refreshUnions, setActiveUnion } = useUnion();
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

    // Discovery State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        setSearching(true);
        try {
            const { unions, error } = await searchUnionsAction(searchQuery, searchLocation);
            if (unions) setSearchResults(unions);
            else if (error) alert("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const handleRequestJoin = async (unionId: string) => {
        if (!confirm("Request to join this union?")) return;
        try {
            const { error } = await requestJoinUnionAction(unionId);
            if (error) alert(error);
            else alert("Request sent!");
        } catch (e) {
            alert("Failed to send request");
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
                                    <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between mb-2">
                                        <code className="text-sm font-mono">{union.inviteCode}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(union.inviteCode)}
                                            className="text-muted-foreground hover:text-primary"
                                            title="Copy Legacy Code"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <SecureInviteGenerator unionId={union.id} />
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
                                {/* TODO: Update createUnion to accept location/description
                                    For now, we just create with name. User can edit settings later.
                                    Or I should update createUnion action now?
                                */}
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
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Search Section */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">Browse Unions</h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        placeholder="Search by name..."
                                        className="flex-1 p-3 border rounded-lg bg-background"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    />
                                    <input
                                        placeholder="Location (e.g. Springfield)"
                                        className="flex-1 md:max-w-xs p-3 border rounded-lg bg-background"
                                        value={searchLocation}
                                        onChange={e => setSearchLocation(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={searching}
                                        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
                                    >
                                        {searching ? "Searching..." : "Search"}
                                    </button>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="grid gap-4 md:grid-cols-2">
                                {searchResults.length === 0 && !searching ? (
                                    <div className="col-span-2 text-center py-12 text-muted-foreground border-dashed border rounded-xl">
                                        Use the search bar to find unions.
                                    </div>
                                ) : (
                                    searchResults.map((u: any) => (
                                        <div key={u.id} className="border rounded-xl p-6 bg-card flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg">{u.name}</h4>
                                                {u.location && (
                                                    <div className="text-sm text-muted-foreground mb-1">📍 {u.location}</div>
                                                )}
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{u.description || "No description provided."}</p>
                                                <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-secondary/50 w-fit px-2 py-1 rounded">
                                                    <Users className="h-3 w-3" />
                                                    {u.member_count?.[0]?.count || 0} Members
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleRequestJoin(u.id)}
                                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
                                                >
                                                    Request Invite
                                                </button>
                                                {unions.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            alert("Alliance feature coming soon in V2");
                                                        }}
                                                        className="border border-primary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/5"
                                                    >
                                                        Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Legacy Alliance Request (Still useful for direct codes) */}
                            <div className="mt-12 pt-8 border-t">
                                <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                                    <ArrowRightLeft className="h-4 w-4" />
                                    Have a direct invite code?
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
                                    <select
                                        value={selectedUnionId}
                                        onChange={(e) => setSelectedUnionId(e.target.value)}
                                        className="p-2 border rounded-md"
                                    >
                                        {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    <input
                                        placeholder="Target Union Invite Code"
                                        className="flex-1 p-2 border rounded-md"
                                        value={allianceCode}
                                        onChange={(e) => setAllianceCode(e.target.value)}
                                    />
                                    <button
                                        onClick={handleRequestAlliance}
                                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="allied">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Pending Alliance Requests */}
                            <PendingAllianceRequests unionId={activeUnion?.id} />

                            <h3 className="text-lg font-semibold mb-4">Allied Unions</h3>
                            {alliedUnions.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-12 text-center">
                                    <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-muted-foreground">No confirmed alliances yet.</p>
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
                                                    <div className="text-xs text-muted-foreground">Alliance Active</div>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                                Partners
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

function PendingAllianceRequests({ unionId }: { unionId?: string }) {
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (unionId) load();
    }, [unionId]);

    const load = async () => {
        if (!unionId) return;
        const { requests: data } = await getPendingAllianceRequestsAction(unionId);
        if (data) setRequests(data);
    };

    const handleRespond = async (id: string, accept: boolean) => {
        await respondToAllianceRequestAction(id, accept);
        load();
    };

    if (requests.length === 0) return null;

    return (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Pending Alliance Requests</h3>
            <div className="space-y-2">
                {requests.map(req => (
                    <div key={req.requestId} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-100">
                        <span className="font-medium">{req.union.name} <span className="text-xs font-normal text-muted-foreground mr-2">wants to connect</span></span>
                        <div className="flex gap-2">
                            <button onClick={() => handleRespond(req.requestId, false)} className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded">Deny</button>
                            <button onClick={() => handleRespond(req.requestId, true)} className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">Accept</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SecureInviteGenerator({ unionId }: { unionId: string }) {
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        try {
            const url = await createSecureInvite(unionId);
            setLink(url);
        } catch (e) {
            alert("Failed to create link: " + e);
        } finally {
            setLoading(false);
        }
    };

    if (link) {
        return (
            <div className="mt-2 text-xs">
                <label className="block text-muted-foreground mb-1">Secure Link (Includes Keys)</label>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={link}
                        className="flex-1 bg-background border rounded px-2 py-1 text-xs truncate"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(link);
                            alert("Link copied!");
                        }}
                        className="bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                    >
                        Copy
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={generate}
            disabled={loading}
            className="w-full mt-2 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded flex items-center justify-center gap-2"
        >
            {loading ? "Generating..." : <><ShieldCheck className="h-3 w-3" /> Create Secure Invite Link</>}
        </button>
    );
}
