"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Sheet } from "@/components/ui/simple-sheet";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-full w-full">
                {/* Desktop Sidebar */}
                <Sidebar className="hidden md:flex w-64" />

                {/* Mobile Sidebar */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <Sidebar onNavigate={() => setMobileMenuOpen(false)} className="border-none shadow-none w-full" />
                </Sheet>

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
                    <main className="flex-1 overflow-y-auto bg-secondary/10">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
