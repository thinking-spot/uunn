import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About uunn | Open Source Union Platform",
    description: "uunn is an open-source, encrypted platform for workplace organizing. Learn how we protect workers with end-to-end encryption.",
};

export default function AboutPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-6">About uunn</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-xl leading-relaxed mb-8">
                    uunn is an open-source, encrypted platform designed to help workers organize, coordinate, and build power in their workplaces — securely and anonymously.
                </p>

                <h2>What is uunn?</h2>
                <p>
                    uunn is a free app that gives workers the tools to start and run a union. Create a group, invite coworkers with a secure link, and begin organizing — all protected by end-to-end encryption. uunn includes encrypted messaging, democratic voting, collaborative document drafting, and the ability to form alliances with other unions. No email required. No employer surveillance.
                </p>

                <h2>Our Mission</h2>
                <p>
                    We believe that the right to organize is fundamental. However, modern surveillance and union-busting tactics have made it harder than ever for workers to connect. We are building the digital infrastructure for the next generation of the labor movement.
                </p>

                <h2>Core Principles</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Workers First:</strong> Every feature is designed for the worker, not the employer.</li>
                    <li><strong>Privacy by Default:</strong> We use end-to-end encryption so even we can&apos;t read your messages.</li>
                    <li><strong>Pseudonymity:</strong> You choose how you appear to others.</li>
                    <li><strong>Open Source:</strong> Our code is public and auditable by anyone.</li>
                </ul>

                <h2>Who We Are</h2>
                <p>
                    We are a collective of engineers, organizers, and designers who believe technology should serve the many, not the few.
                </p>

            </div>
        </div>
    );
}
