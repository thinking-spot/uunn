'use client';

import { useState, useEffect } from "react";
import { useUnion } from "@/context/UnionContext";
import { updateUnionSettingsAction, getUnion } from "@/lib/client-actions/unions"; // We need to export updateUnionSettingsAction from client-actions OR import server action directly? 
// Ideally we import server action directly in Next.js App Router for client components usually fine if 'use server' is at top of action file.
import { updateUnionSettingsAction as updateSettings } from "@/lib/union-actions";
// Note: importing server action directly into Client Component is valid.

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Assuming we have these or use standard labels
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
    const { activeUnion, refreshUnions } = useUnion();

    // Form State
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(false);

    useEffect(() => {
        if (activeUnion) {
            // Load fresh details (in case context is stale regarding location/desc)
            // Or just use what we have if we update context? 
            // Context usually has basic info. Let's assume we might need a fresh fetch if 'location' isn't in context type yet.
            // For now, let's just fetch or default empty.
            // Actually, we added location/desc to the SCHEMA, but did we add it to the `getUserUnions` fetch?
            // `getUserUnions` fetches `Union` table props.
            // We should probably update `getUserUnions` to fetch `location` and `description`.
            // But for now, let's lazily fetch or just set from activeUnion if available.

            // To be safe, let's assume activeUnion might NOT have them yet in client type.
            // We can fetch via getUnion(activeUnion.id).
            setInitLoading(true);
            getUnion(activeUnion.id).then(u => {
                if (u) {
                    setLocation(u.location || "");
                    setDescription(u.description || "");
                    setIsPublic(u.is_public !== false); // default true
                }
                setInitLoading(false);
            });
        }
    }, [activeUnion]);

    const handleSave = async () => {
        if (!activeUnion) return;
        setLoading(true);
        try {
            const { error } = await updateSettings(activeUnion.id, {
                location,
                description,
                is_public: isPublic
            });

            if (error) {
                alert(error);
            } else {
                alert("Settings saved!");
                refreshUnions(); // Update context
            }
        } catch (e) {
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    if (!activeUnion) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <p className="text-muted-foreground">Select a union to manage settings.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Union Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>General Configuration</CardTitle>
                    <CardDescription>Manage visibility and details for <strong>{activeUnion.name}</strong>.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {initLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Union Name (Read Only)</label>
                                <input
                                    disabled
                                    className="w-full p-2 border rounded bg-muted"
                                    value={activeUnion.name}
                                />
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
        </div>
    );
}
