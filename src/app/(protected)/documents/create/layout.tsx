import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Document",
    description: "Draft a new encrypted union document. Your content is encrypted before it leaves your browser.",
};

export default function CreateDocumentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
