'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUnion } from "@/context/UnionContext";
import { getUnion } from "@/lib/client-actions/unions";
import { updateUnionSettingsAction as updateUnionSettings } from "@/lib/union-actions";
import { getUserProfileAction, updateUserProfileAction, deleteAccountAction } from "@/lib/actions";
import { signOut } from "next-auth/react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

import { Loader2, Save, User, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEYS } from "@/lib/constants";

// --- Profile Settings Tab ---
function ProfileSettings() {
    const { user } = useAuth();
    const { activeUnion } = useUnion();

    const [username, setUsername] = useState("");
    const [joinedAt, setJoinedAt] = useState("");
    const [role, setRole] = useState("");
    const [location, setLocation] = useState("");
    const [preferredContact, setPreferredContact] = useState("");

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        getUserProfileAction().then(result => {
            if (result.profile) {
                setUsername(result.profile.username);
                setJoinedAt(new Date(result.profile.created_at).toLocaleDateString());
                setLocation(result.profile.location || "");
                setPreferredContact(result.profile.preferred_contact || "");
            }
            setInitLoading(false);
        });
    }, []);

    useEffect(() => {
        setRole(activeUnion?.role === "admin" ? "Admin" : "Member");
    }, [activeUnion]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateUserProfileAction(location, preferredContact);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile saved!");
            }
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            const result = await deleteAccountAction();
            if (result.error) {
                toast.error(result.error);
                setDeleteLoading(false);
                return;
            }
            // Clear crypto keys and sign out
            sessionStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
            sessionStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
            await signOut({ redirect: true, redirectTo: "/login" });
        } catch {
            toast.error("Failed to delete account");
            setDeleteLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {initLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username (Read Only)</label>
                            <input disabled className="w-full p-2 border rounded bg-muted" value={username} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">User Joined (Read Only)</label>
                            <input disabled className="w-full p-2 border rounded bg-muted" value={joinedAt} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Admin Status (Read Only)</label>
                            <input disabled className="w-full p-2 border rounded bg-muted" value={activeUnion ? role : "No union selected"} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="e.g. Company, City, State"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional. Company, city, state, or country.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preferred Contact</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder='e.g. email, phone, or "no"'
                                value={preferredContact}
                                onChange={e => setPreferredContact(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional. How other union members can reach you.</p>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
                <Button onClick={handleSave} disabled={loading || initLoading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
                <div>
                    {!showDeleteConfirm ? (
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={initLoading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-destructive">Are you sure? This is permanent.</span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, delete"}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}

// --- Union Settings Tab ---
function UnionSettings() {
    const { activeUnion, refreshUnions } = useUnion();

    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(false);

    useEffect(() => {
        if (activeUnion) {
            setInitLoading(true);
            getUnion(activeUnion.id).then(u => {
                if (u) {
                    setLocation(u.location || "");
                    setDescription(u.description || "");
                    setIsPublic(u.isPublic !== false);
                }
                setInitLoading(false);
            });
        }
    }, [activeUnion]);

    const handleSave = async () => {
        if (!activeUnion) return;
        setLoading(true);
        try {
            const { error } = await updateUnionSettings(activeUnion.id, {
                location,
                description,
                is_public: isPublic
            });
            if (error) {
                toast.error(error);
            } else {
                toast.success("Union settings saved!");
                refreshUnions();
            }
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    if (!activeUnion) {
        return (
            <Card>
                <CardContent className="p-8">
                    <p className="text-muted-foreground">Select a union to manage its settings.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Union Settings</CardTitle>
                <CardDescription>Manage visibility and details for <strong>{activeUnion.name}</strong>.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {initLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Union Name (Read Only)</label>
                            <input disabled className="w-full p-2 border rounded bg-muted" value={activeUnion.name} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="e.g. New York, NY"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Helps users find you in search.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="w-full p-2 border rounded min-h-[100px]"
                                placeholder="Tell potential members what this union is about..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 p-4 border rounded bg-secondary/10">
                            <input
                                type="checkbox"
                                id="public-toggle"
                                className="h-4 w-4"
                                checked={isPublic}
                                onChange={e => setIsPublic(e.target.checked)}
                            />
                            <label htmlFor="public-toggle" className="text-sm font-medium cursor-pointer">
                                Make Union Publicly Searchable
                            </label>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={loading || initLoading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Settings Page ---
export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            <Tabs defaultValue="profile">
                <TabsList className="mb-6">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="union">
                        <Settings className="mr-2 h-4 w-4" />
                        Union
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettings />
                </TabsContent>

                <TabsContent value="union">
                    <UnionSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
