"use client";

import { UserDropdown } from "@/components/UserDropdown";
import { Building2, Menu } from "lucide-react";
import { useUnion } from "@/context/UnionContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TopBarProps {
    onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { activeUnion, loading } = useUnion();

    return (
        <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {loading ? (
                        <span className="text-sm font-medium animate-pulse">Loading...</span>
                    ) : activeUnion ? (
                        <span className="text-sm font-medium">{activeUnion.name}</span>
                    ) : (
                        <Link href="/unions" className="text-sm font-medium text-primary hover:underline">
                            Join or Create a Union
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <UserDropdown />
            </div>
        </header>
    );
}
