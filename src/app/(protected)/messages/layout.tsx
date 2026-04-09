import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Secure Messages",
    description: "Send and receive end-to-end encrypted messages with your union members.",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
