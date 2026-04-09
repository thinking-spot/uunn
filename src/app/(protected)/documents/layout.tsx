import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Documents",
    description: "Draft and manage encrypted union documents — petitions, grievances, and demand letters.",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
