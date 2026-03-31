import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Log In",
    description: "Sign in to uunn to access your union. Encrypted, anonymous, and secure.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return children;
}
