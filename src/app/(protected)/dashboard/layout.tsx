import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "View your union's activity — active votes, recent documents, and member updates.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
