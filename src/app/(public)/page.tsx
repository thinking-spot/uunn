import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Users, FileText, Lock, Eye, Code, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Start a Union | A Free, Secure App",
    description: "A simple, secure way to create a union with anyone. E2E encrypted, open source, free for everyone. organize, vote, act, together.",
};

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Link className="flex items-center justify-center" href="#">
                    <Image src="/logo.png" alt="uunn" width={28} height={28} />
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/how-it-works">
                        How It Works
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/education">
                        Education
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Login
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login?signup=1">
                        Get Started
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero */}
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
                                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    href="/login?signup=1"
                                >
                                    Start Organizing
                                </Link>
                                <Link
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    href="/about"
                                >
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
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

                {/* How It Works */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">How It Works</h2>
                        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">1</div>
                                <h3 className="text-lg font-semibold">Create a Union</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Sign up with a pseudonym — no email required. Create a union in seconds.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">2</div>
                                <h3 className="text-lg font-semibold">Invite Coworkers</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Share a secure invite link or code. Keys are exchanged automatically.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">3</div>
                                <h3 className="text-lg font-semibold">Organize Together</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Chat securely, vote on decisions, draft documents, and build alliances.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 space-y-4">
                                <h2 className="text-3xl font-bold tracking-tighter">Built for Security</h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    uunn uses the same encryption standards trusted by governments and banks. Your messages are encrypted on your device before they ever leave it — not even we can read them.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> AES-256 encryption for all messages and documents</li>
                                    <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Zero-knowledge architecture — we never see your data</li>
                                    <li className="flex items-center gap-2"><Code className="h-4 w-4 text-primary" /> Open source and publicly auditable</li>
                                </ul>
                                <Link href="/security" className="inline-flex items-center text-sm text-primary hover:underline">
                                    Learn about our security model <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                                    <Shield className="h-16 w-16 text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Why Workers Trust uunn</h2>
                        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
                            <div className="p-6 rounded-lg border bg-background">
                                <h3 className="font-semibold mb-2">No Tracking</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No analytics, no cookies, no IP logging. We don&apos;t collect what we don&apos;t need.
                                </p>
                            </div>
                            <div className="p-6 rounded-lg border bg-background">
                                <h3 className="font-semibold mb-2">Pseudonymous Accounts</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Sign up with just a username and password. No email, no phone number, no real name.
                                </p>
                            </div>
                            <div className="p-6 rounded-lg border bg-background">
                                <h3 className="font-semibold mb-2">Free & Open Source</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    uunn is free to use and open source. Anyone can inspect the code and verify our claims.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="w-full py-16 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to organize?</h2>
                            <p className="mx-auto max-w-[500px] text-gray-500 dark:text-gray-400">
                                Join workers everywhere building power in their workplaces. Free, encrypted, and built for you.
                            </p>
                            <Link
                                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                href="/login?signup=1"
                            >
                                Get Started — It&apos;s Free
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="uunn" width={20} height={20} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2026 uunn. Open source.</p>
                </div>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
                        Privacy
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/security">
                        Security
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/how-it-works">
                        How It Works
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/education">
                        Education
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="/about">
                        About
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
