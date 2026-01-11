"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { User, Bell, Shield, Palette, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");

    if (!user) return null;

    const userInitials = user.displayName
        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : user.email?.[0].toUpperCase() || "U";

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-left",
                                    activeTab === tab.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <div className="flex-1 lg:max-w-2xl">
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-col space-y-1.5 p-6">
                                    <h3 className="text-2xl font-semibold leading-none tracking-tight">Account Information</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your account details and registration information
                                    </p>
                                </div>
                                <div className="p-6 pt-0">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="relative">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt={user.displayName || "User"} className="h-24 w-24 rounded-full object-cover" />
                                            ) : (
                                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-3xl font-bold">
                                                    {userInitials}
                                                </div>
                                            )}
                                            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-sm hover:bg-primary/90">
                                                <Camera className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{user.displayName || "User"}</h2>
                                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                <User className="h-4 w-4" />
                                                <span>{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                                                <span>Member since {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-md border bg-muted/50 p-4">
                                            <div className="text-sm font-medium text-muted-foreground mb-1">User ID</div>
                                            <div className="text-sm font-mono truncate">{user.uid}</div>
                                        </div>
                                        <div className="rounded-md border bg-green-500/10 p-4">
                                            <div className="text-sm font-medium text-green-600 mb-1">Account Status</div>
                                            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                                <div className="h-2 w-2 rounded-full bg-green-600" />
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-col space-y-1.5 p-6">
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">Edit Profile</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Update your personal information
                                    </p>
                                </div>
                                <div className="p-6 pt-0 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Display Name</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue={user.displayName || ""}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== "profile" && (
                        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                            <div className="text-center text-muted-foreground">
                                {(() => {
                                    const currentTab = tabs.find(t => t.id === activeTab);
                                    const Icon = currentTab?.icon || Bell;
                                    return <Icon className="mx-auto h-10 w-10 opacity-50 mb-4" />;
                                })()}
                                <h3 className="text-lg font-medium">Coming Soon</h3>
                                <p>This section is under development.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
