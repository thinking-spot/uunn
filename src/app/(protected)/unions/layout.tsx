import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Unions",
    description: "Create or join a union, manage your memberships, and discover public unions.",
};

export default function UnionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
