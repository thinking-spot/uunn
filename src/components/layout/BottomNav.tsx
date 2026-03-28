'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Vote, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    onOpenMenu: () => void;
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
    const pathname = usePathname();

    const tabs = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Chat", href: "/messages", icon: MessageSquare },
        { name: "Votes", href: "/votes", icon: Vote },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex justify-around items-center h-16 pb-safe">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                        <span className="text-[10px] font-medium">{tab.name}</span>
                    </Link>
                );
            })}

            {/* More Menu Trigger */}
            <button
                onClick={onOpenMenu}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground"
            >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">More</span>
            </button>
        </div>
    );
}
