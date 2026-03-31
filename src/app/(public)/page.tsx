import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Start a Union | A Free, Secure App",
    description: "A simple, secure way to create a union with anyone. E2E encrypted, open source, free for everyone. organize, vote, act, together.",
};
import Image from "next/image";
import { Shield, Users, FileText } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Link className="flex items-center justify-center" href="#">
                    <Image src="/logo.png" alt="uunn" width={28} height={28} />
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Login
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login?signup=1">
                        Get Started
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/5">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    <span className="text-primary">uunn</span> <br />a secure app for unions
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    The encrypted app for workplace organizing. Start a union, connect with coworkers, and coordinate actions — without employers listening in.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                    href="/login?signup=1"
                                >
                                    Start Organizing
                                </Link>
                                <Link
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                    href="/about"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <Shield className="h-12 w-12 text-primary" />
                                <h2 className="text-xl font-bold">Encrypted & Anonymous</h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    End-to-end encryption protects your messages. Pseudonyms protect your identity.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <Users className="h-12 w-12 text-primary" />
                                <h2 className="text-xl font-bold">Collective Coordination</h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Manage votes, run polls, and track commitments for workplace actions.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <FileText className="h-12 w-12 text-primary" />
                                <h2 className="text-xl font-bold">Templates & Resources</h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Generate petitions, grievances, and demands with expert-crafted templates.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="uunn" width={20} height={20} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 uunn. Open source.</p>
                </div>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
                        Privacy
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/security">
                        Security
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/about">
                        About
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
