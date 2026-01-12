"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    AlertCircle,
    MessageSquare,
    Vote,
    FileText,
    Users,
    Building2,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Votes", href: "/votes", icon: Vote },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Members", href: "/members", icon: Users },
    { name: "Unions", href: "/unions", icon: Building2 },
];

interface SidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("flex h-full flex-col border-r bg-card text-card-foreground shadow-sm", className)}>
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">uunn</h1>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:pl-4"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t space-y-1">
                <Link
                    href="/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                        pathname === "/settings"
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:pl-4"
                    )}
                >
                    <Settings className="h-5 w-5" />
                    Settings
                </Link>
            </div>
        </div>
    );
}
