"use client";

import { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/constants";

// Define a minimal User type compatible with what we expect
interface User {
    uid: string; // Map NextAuth id to uid for compatibility
    displayName: string | null;
    email: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const loading = status === "loading";

    // Map NextAuth user to our app's expected User shape
    const user: User | null = session?.user ? {
        uid: session.user.id || "",
        displayName: session.user.name || null,
        email: session.user.email || null,
    } : null;

    const logout = async () => {
        // Clear cryptographic keys from session storage
        sessionStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
        sessionStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
        await signOut({ redirect: false });
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
