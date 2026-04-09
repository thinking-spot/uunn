import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Votes & Polls",
    description: "Run democratic votes and polls for your union. Create proposals and track results.",
};

export default function VotesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
