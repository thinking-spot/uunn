"use client";

import { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define a minimal User type compatible with what we expect
interface User {
    uid: string; // Map NextAuth id to uid for compatibility
    displayName: string | null;
    email: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
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

    const signInWithGoogle = async () => {
        throw new Error("Use the new Login page.");
    };

    const registerWithEmail = async () => {
        throw new Error("Use the new Login page.");
    };

    const loginWithEmail = async () => {
        throw new Error("Use the new Login page.");
    };

    const resetPassword = async () => {
        throw new Error("Feature not available in pseudonymous mode.");
    };

    const logout = async () => {
        await signOut({ redirect: false });
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, registerWithEmail, loginWithEmail, resetPassword, logout }}>
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
