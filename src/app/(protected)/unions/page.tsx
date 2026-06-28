"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Users, ArrowRightLeft, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
    Union
} from "@/lib/client-actions/unions";
import { distributeAllianceKeys } from "@/lib/client-actions/alliances";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useUnion } from "@/context/UnionContext";

const VALID_TABS = new Set(["my-unions", "join", "create", "discover", "allied"]);

export default function UnionsPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "my-unions";
    const { unions, activeUnion, refreshUnions, setActiveUnion } = useUnion();
    const [alliedUnions, setAlliedUnions] = useState<Union[]>([]);
    // loading is handled by UnionContext for unions, but we might want local loading for actions
    const [actionLoading, setActionLoading] = useState(false);

    // Form States
    const [joinCode, setJoinCode] = useState("");
    const [createName, setCreateName] = useState("");
    const [createLocation, setCreateLocation] = useState("");
    const [createDescription, setCreateDescription] = useState("");
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
            console.error("Failed to load allies:", error);
            toast.error("Failed to load allied unions.");
        }
    };

    const handleCreate = async () => {
        if (!createName || !user) return;
        setActionLoading(true);
        try {
            const newUnionId = await createUnion(createName, user.uid, createLocation || undefined, createDescription || undefined);
            setCreateName("");
            setCreateLocation("");
            setCreateDescription("");
            toast.success("Union created!");
            await refreshUnions();
            // Force set active union to the new one
            const newUnion = await getUnion(newUnionId);
            if (newUnion) setActiveUnion(newUnion);
        } catch (error) {
            toast.error("Error creating union: " + error);
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
            toast.success("Joined union!");
            await refreshUnions();
            // Force set active union to the new one
            const newUnion = await getUnion(newUnionId);
            if (newUnion) setActiveUnion(newUnion);
        } catch (error) {
            toast.error("Error joining union: " + error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestAlliance = async () => {
        if (!allianceCode || !selectedUnionId) return;
        try {
            await requestAlliance(selectedUnionId, allianceCode);
            setAllianceCode("");
            toast.success("Alliance request sent!");
        } catch (error) {
            toast.error("Error requesting alliance: " + error);
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
            else if (error) toast.error("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const handleRequestJoin = async (unionId: string) => {
        if (!confirm("Request to join this union?")) return;
        try {
            const { error } = await requestJoinUnionAction(unionId);
            if (error) toast.error(error);
            else toast.success("Request sent!");
        } catch (e) {
            toast.error("Failed to send request");
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

                <Tabs defaultValue={initialTab} className="w-full">
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {unions.map(union => (
                                <div key={union.id} className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {union.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{union.name}</h3>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Users className="mr-1 h-3 w-3" />
                                                {union.memberCount} {union.memberCount === 1 ? 'member' : 'members'}
                                            </div>
                                        </div>
                                    </div>
                                    {union.location && (
                                        <p className="text-xs text-muted-foreground mb-1">📍 {union.location}</p>
                                    )}
                                    {union.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{union.description}</p>
                                    )}
                                    {union.role === 'admin' && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Invite management lives on the{" "}
                                            <Link href="/members" className="text-primary hover:underline">
                                                Members page
                                            </Link>
                                            .
                                        </p>
                                    )}
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
                        <div className="max-w-md mx-auto mt-12 p-6 border rounded-xl bg-card">
                            <h3 className="text-lg font-semibold mb-4">Create a New Union</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="create-name" className="text-sm font-medium block mb-1">
                                        Union name
                                    </label>
                                    <input
                                        id="create-name"
                                        placeholder="e.g. Acme Workers United"
                                        className="w-full p-2 border rounded-md"
                                        maxLength={200}
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                        aria-describedby="create-name-help"
                                    />
                                    <p id="create-name-help" className="text-xs text-muted-foreground mt-1">
                                        {createName.length > 0
                                            ? `${createName.length}/200 characters`
                                            : 'Required. Visible to other members.'}
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="create-location" className="text-sm font-medium block mb-1">
                                        Location <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <input
                                        id="create-location"
                                        placeholder="e.g. Springfield, MO"
                                        className="w-full p-2 border rounded-md"
                                        maxLength={200}
                                        value={createLocation}
                                        onChange={(e) => setCreateLocation(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="create-description" className="text-sm font-medium block mb-1">
                                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        id="create-description"
                                        placeholder="What is this union organizing for?"
                                        className="w-full p-2 border rounded-md min-h-[80px]"
                                        maxLength={2000}
                                        value={createDescription}
                                        onChange={(e) => setCreateDescription(e.target.value)}
                                        aria-describedby="create-desc-help"
                                    />
                                    <p id="create-desc-help" className="text-xs text-muted-foreground mt-1">
                                        {createDescription.length}/2000 characters.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCreate}
                                    disabled={actionLoading || !createName.trim()}
                                    className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {actionLoading ? "Creating..." : "Create Union"}
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
                                                        onClick={async () => {
                                                            if (!selectedUnionId) {
                                                                toast.error("Select one of your unions first");
                                                                return;
                                                            }
                                                            if (!confirm(`Request alliance between your union and "${u.name}"?`)) return;
                                                            try {
                                                                await requestAlliance(selectedUnionId, u.id);
                                                                toast.success("Alliance request sent!");
                                                            } catch (error) {
                                                                toast.info("Failed to request alliance: " + error);
                                                            }
                                                        }}
                                                        className="border border-primary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/5"
                                                    >
                                                        Request Alliance
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
                                        <AlliedUnionCard
                                            key={ally.id}
                                            ally={ally}
                                            canRepair={activeUnion?.role === 'admin'}
                                            onDissolved={() => activeUnion && loadAllies(activeUnion.id)}
                                        />
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

function AlliedUnionCard({ ally, canRepair, onDissolved }: { ally: Union; canRepair: boolean; onDissolved: () => void }) {
    const [repairing, setRepairing] = useState(false);
    const [repaired, setRepaired] = useState(false);
    const [dissolving, setDissolving] = useState(false);

    const handleRepair = async () => {
        if (!ally.allianceId) return;
        setRepairing(true);
        try {
            const { distributeAllianceKeys } = await import("@/lib/client-actions/alliances");
            await distributeAllianceKeys(ally.allianceId);
            setRepaired(true);
            toast.success("Encrypted channel repaired.");
        } catch (e) {
            const reason = e instanceof Error ? e.message : "unknown error";
            toast.error(`Repair failed: ${reason}`);
        } finally {
            setRepairing(false);
        }
    };

    const handleDissolve = async () => {
        if (!ally.allianceId) return;
        // Confirm explicitly — this irreversibly deletes the encrypted alliance
        // channel and all its message history (CASCADE on AllianceMessages).
        const ok = window.confirm(
            `End the alliance with ${ally.name}?\n\nThis deletes the shared encrypted channel and all messages in it for both unions. This cannot be undone.`,
        );
        if (!ok) return;
        setDissolving(true);
        try {
            const { dissolveAllianceAction } = await import("@/lib/union-actions");
            const result = await dissolveAllianceAction(ally.allianceId);
            if ('error' in result && result.error) {
                toast.error(result.error);
                setDissolving(false);
                return;
            }
            toast.success(`Alliance with ${ally.name} ended.`);
            onDissolved();
        } catch (e) {
            toast.error(`Failed to dissolve: ${e instanceof Error ? e.message : 'unknown error'}`);
            setDissolving(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                        {ally.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium truncate">{ally.name}</div>
                        <div className="text-xs text-muted-foreground">Alliance Active</div>
                    </div>
                </div>
                <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium shrink-0">
                    Partners
                </div>
            </div>
            {canRepair && ally.allianceId && (
                <div className="border-t pt-3 space-y-2">
                    <button
                        onClick={handleRepair}
                        disabled={repairing || repaired || dissolving}
                        className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 rounded border border-dashed hover:border-solid transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        {repairing && <Loader2 className="h-3 w-3 animate-spin" />}
                        {repaired
                            ? "Encrypted channel up to date"
                            : repairing
                                ? "Repairing…"
                                : "Repair encrypted channel"}
                    </button>
                    <p className="text-[10px] text-muted-foreground px-1">
                        Re-distributes the alliance encryption key to every member of both unions.
                        Use if alliance messaging stopped working after a member was added or removed.
                    </p>
                    <button
                        onClick={handleDissolve}
                        disabled={dissolving || repairing}
                        className="w-full text-xs text-destructive hover:bg-destructive/5 py-1.5 rounded border border-dashed border-destructive/40 hover:border-destructive transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        {dissolving && <Loader2 className="h-3 w-3 animate-spin" />}
                        {dissolving ? "Ending alliance…" : "End alliance"}
                    </button>
                    <p className="text-[10px] text-muted-foreground px-1">
                        Permanently deletes the encrypted channel and all messages in it, on both sides.
                    </p>
                </div>
            )}
        </div>
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
        // Accepting commits the alliance row first; key distribution happens
        // client-side after. If distribution fails the alliance exists but
        // can't be used — retry with backoff before giving up, and surface a
        // recoverable error if all retries fail.
        try {
            await respondToAllianceRequestAction(id, accept);
        } catch {
            toast.error("Failed to record your response to the alliance request.");
            load();
            return;
        }

        if (!accept) {
            toast.success("Alliance request denied.");
            load();
            return;
        }

        toast.info("Setting up encrypted channel...");
        let lastError: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await distributeAllianceKeys(id);
                toast.success("Alliance established with encrypted messaging.");
                load();
                return;
            } catch (e) {
                lastError = e;
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 500 * attempt));
                }
            }
        }
        const reason = lastError instanceof Error ? lastError.message : "unknown error";
        toast.error(
            `Alliance accepted, but encrypted channel setup failed (${reason}). ` +
            `Refresh and re-accept, or ask an admin from the other union to retry.`,
            { duration: 10_000 },
        );
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

