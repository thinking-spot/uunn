import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Members",
    description: "Manage union membership, approve requests, and generate secure invite links.",
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
