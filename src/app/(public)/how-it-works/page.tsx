import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Users, FileText, MessageSquare, Vote, Handshake, ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
    title: "How to Start a Union | Free Encrypted Platform",
    description: "Learn how to start a union, form a union, or join a union with uunn — the free, encrypted app for workplace organizing. No email required, fully anonymous.",
};

export default function HowItWorksPage() {
    return (
        <div className="container px-4 md:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">How to Start a Union with uunn</h1>
            <p className="text-xl text-muted-foreground mb-12">
                uunn makes it simple and safe to form a union, join a union, or create a union at your workplace. Every message, vote, and document is end-to-end encrypted — your employer can never see what you&apos;re doing.
            </p>

            {/* Step-by-step: Create a Union */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">How to Create a Union on uunn</h2>
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                        <div>
                            <h3 className="font-semibold text-lg">Sign Up with a Pseudonym</h3>
                            <p className="text-muted-foreground text-sm">
                                Create an account with just a username and password. No email, no phone number, no real name required. Your identity stays private from day one.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                        <div>
                            <h3 className="font-semibold text-lg">Create Your Union</h3>
                            <p className="text-muted-foreground text-sm">
                                Give your union a name and it&apos;s created instantly. Encryption keys are generated automatically in your browser — the server never sees them.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                        <div>
                            <h3 className="font-semibold text-lg">Invite Your Coworkers</h3>
                            <p className="text-muted-foreground text-sm">
                                Share a secure invite link or code with trusted coworkers. When they join, encryption keys are exchanged automatically so everyone can communicate securely.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">4</div>
                        <div>
                            <h3 className="font-semibold text-lg">Start Organizing</h3>
                            <p className="text-muted-foreground text-sm">
                                Send encrypted messages, run democratic votes, draft documents together, and build alliances with other unions — all from one secure platform.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <Link
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                        href="/login?signup=1"
                    >
                        Create a Union Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Join a Union */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">How to Join a Union on uunn</h2>
                <p className="text-muted-foreground mb-4">
                    If a coworker has already started a union on uunn, joining is simple and secure.
                </p>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Get an invite link or join code from a union member — share it in person for maximum security.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Create a pseudonymous account (or log in if you already have one).</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">Enter the invite code or click the link. Your encryption keys are set up automatically.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">You&apos;re in — start messaging, voting, and organizing with your coworkers immediately.</p>
                    </div>
                </div>
            </section>

            {/* What You Can Do */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">What You Can Do on uunn</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-6 rounded-lg border bg-card">
                        <MessageSquare className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Encrypted Messaging</h3>
                        <p className="text-muted-foreground text-sm">
                            Send messages that only your union members can read. AES-256 encryption means not even uunn can see your conversations.
                        </p>
                    </div>
                    <div className="p-6 rounded-lg border bg-card">
                        <Vote className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Democratic Voting</h3>
                        <p className="text-muted-foreground text-sm">
                            Run encrypted polls and votes on workplace decisions. Every member gets a voice, and results are transparent to the group.
                        </p>
                    </div>
                    <div className="p-6 rounded-lg border bg-card">
                        <FileText className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Document Drafting</h3>
                        <p className="text-muted-foreground text-sm">
                            Collaboratively draft petitions, grievances, demands, and other documents with AI-assisted templates.
                        </p>
                    </div>
                    <div className="p-6 rounded-lg border bg-card">
                        <Handshake className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold text-lg mb-2">Union Alliances</h3>
                        <p className="text-muted-foreground text-sm">
                            Connect with other unions on uunn to share strategies, coordinate actions, and build collective power across workplaces.
                        </p>
                    </div>
                </div>
            </section>

            {/* Security */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">Safe and Secure Organizing</h2>
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                    <p className="text-muted-foreground mb-4">
                        uunn was built from the ground up to protect workers who are forming a union. Every piece of content is encrypted on your device before it leaves your browser.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary shrink-0" /> End-to-end encryption — the server only stores ciphertext</li>
                        <li className="flex items-center gap-2"><Users className="h-4 w-4 text-primary shrink-0" /> Pseudonymous accounts — no email or real name required</li>
                        <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary shrink-0" /> Zero-knowledge architecture — we can&apos;t read your data even if compelled</li>
                        <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary shrink-0" /> Open source — anyone can audit the code</li>
                    </ul>
                    <Link href="/security" className="inline-flex items-center text-sm text-primary hover:underline mt-4">
                        Read our full security model <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-6 border-b pb-2">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-1">Is it free to start a union on uunn?</h3>
                        <p className="text-sm text-muted-foreground">
                            Yes. uunn is completely free to use. There are no paid tiers, no ads, and no hidden costs. We believe access to organizing tools is a right, not a privilege.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-1">Can my employer see my activity?</h3>
                        <p className="text-sm text-muted-foreground">
                            No. All content on uunn is end-to-end encrypted. Your employer cannot see your messages, votes, or documents — and neither can we. For best security, use a personal device and network.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-1">Do I need an email to join?</h3>
                        <p className="text-sm text-muted-foreground">
                            No. You sign up with just a username and password. No email, phone number, or personal information is required.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-1">What is end-to-end encryption?</h3>
                        <p className="text-sm text-muted-foreground">
                            End-to-end encryption means your messages are scrambled on your device before being sent, and can only be unscrambled by the intended recipients. No one in between — not uunn, not your ISP, not your employer — can read the content.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-1">How is uunn different from Signal or WhatsApp?</h3>
                        <p className="text-sm text-muted-foreground">
                            uunn is purpose-built for union organizing, not general messaging. It includes voting, document drafting, union alliances, and pseudonymous accounts — features that generic chat apps don&apos;t offer. And unlike WhatsApp, uunn is open source with no corporate ownership.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-1">Can I be in multiple unions?</h3>
                        <p className="text-sm text-muted-foreground">
                            Yes. You can create or join as many unions as you need, each with its own encrypted space and membership.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="text-center py-8">
                <h2 className="text-3xl font-bold tracking-tighter mb-4">Ready to form your union?</h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Join workers everywhere who are using uunn to organize, coordinate, and build power — securely and anonymously.
                </p>
                <div className="space-x-4">
                    <Link
                        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                        href="/login?signup=1"
                    >
                        Get Started — It&apos;s Free
                    </Link>
                    <Link
                        className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        href="/education"
                    >
                        Learn About Your Rights
                    </Link>
                </div>
            </section>
          </div>
        </div>
    );
}
