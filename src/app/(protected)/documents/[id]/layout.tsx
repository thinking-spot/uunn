import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Document Editor",
    description: "Edit your encrypted union document. Only your union members can read its contents.",
};

export default function DocumentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
