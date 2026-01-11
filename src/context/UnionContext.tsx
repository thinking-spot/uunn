"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserUnions, Union } from "@/services/unionService";

interface UnionContextType {
    unions: Union[];
    activeUnion: Union | null;
    loading: boolean;
    setActiveUnion: (union: Union | null) => void;
    refreshUnions: () => Promise<void>;
}

const UnionContext = createContext<UnionContextType | null>(null);

export function UnionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [unions, setUnions] = useState<Union[]>([]);
    const [activeUnion, setActiveUnion] = useState<Union | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUnions = async () => {
        if (!user) {
            setUnions([]);
            setActiveUnion(null);
            setLoading(false);
            return;
        }

        try {
            const data = await getUserUnions(user.uid);
            setUnions(data);
            // If activeUnion is not in the new list (or null), set to first available
            if (data.length > 0) {
                if (!activeUnion || !data.find(u => u.id === activeUnion.id)) {
                    setActiveUnion(data[0]);
                }
            } else {
                setActiveUnion(null);
            }
        } catch (error) {
            console.error("Failed to fetch unions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUnions();
    }, [user]);

    return (
        <UnionContext.Provider value={{ unions, activeUnion, loading, setActiveUnion, refreshUnions }}>
            {children}
        </UnionContext.Provider>
    );
}

export function useUnion() {
    const context = useContext(UnionContext);
    if (!context) {
        throw new Error("useUnion must be used within a UnionProvider");
    }
    return context;
}
