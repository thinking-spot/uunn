"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    User,
    Settings,
    LogOut,
    Building2,
    ChevronDown,
    Check,
    Moon,
    Sun,
    Laptop
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserDropdown() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const userInitials = user.displayName
        ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : user.email?.[0].toUpperCase() || "U";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
            >
                <div className="flex flex-col items-end mr-2 hidden md:flex">
                    <span className="text-sm font-medium leading-none">{user.displayName || "User"}</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                    {userInitials}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border bg-card p-2 shadow-lg animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="flex items-center gap-3 p-2 border-b mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-lg">
                            {userInitials}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold truncate">{user.displayName || "User"}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                    </div>

                    <div className="my-2 border-t" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Unions
                    </div>
                    <div className="space-y-1">
                        <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span className="truncate">Springfield Warehouse...</span>
                            </div>
                            <Check className="h-3 w-3 text-primary" />
                        </button>
                        <Link
                            href="/unions"
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <Building2 className="h-4 w-4 opacity-50" />
                            Manage Unions
                        </Link>
                    </div>

                    <div className="my-2 border-t" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Theme
                    </div>
                    <div className="flex items-center gap-1 px-2 pb-2">
                        <button
                            onClick={() => setTheme("light")}
                            className={cn("flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors", theme === "light" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}
                            title="Light Mode"
                        >
                            <Sun className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={cn("flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors", theme === "dark" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}
                            title="Dark Mode"
                        >
                            <Moon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setTheme("system")}
                            className={cn("flex-1 flex items-center justify-center p-1.5 rounded-md transition-colors", theme === "system" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}
                            title="System Mode"
                        >
                            <Laptop className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="my-2 border-t" />

                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
