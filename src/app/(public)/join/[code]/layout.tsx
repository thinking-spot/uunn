import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Join a Union",
    description: "Use your invite code to join a union on uunn. Secure, encrypted, and pseudonymous.",
    robots: { index: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
