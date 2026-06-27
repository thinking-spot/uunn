import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "uunn collects minimal data and encrypts everything end-to-end. Your messages, documents, and votes are never readable by us.",
    openGraph: {
        title: "Privacy Policy | uunn",
        description: "uunn collects minimal data and encrypts everything end-to-end. Your messages, documents, and votes are never readable by us.",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Privacy Policy | uunn",
        description: "uunn collects minimal data and encrypts everything end-to-end. Your messages, documents, and votes are never readable by us.",
    },
};

export default function PrivacyPage() {
    return (
        <div className="w-full px-4 md:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Effective April 7, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-bold mb-4">What We Store</h2>
                    <p className="text-muted-foreground mb-4">
                        We practice data minimization. We only store what is needed to deliver the service.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li>Your <strong>username</strong> and a <strong>bcrypt hash</strong> of your password (we never store plaintext passwords).</li>
                        <li>Your <strong>public key</strong>, and an encrypted vault containing your private key (we cannot decrypt the vault without your password).</li>
                        <li>Union membership rows — i.e. which usernames belong to which unions — so the app can route messages to the right people.</li>
                        <li>Message, document, vote, and (most) title ciphertext, plus timestamps and sender IDs. The content itself is encrypted on your device with keys we never see.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">What We Don&apos;t Have</h2>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Plaintext content:</strong> Messages, document bodies, vote choices, and (with rare exception) titles are end-to-end encrypted. We cannot read them.</li>
                        <li><strong>Your real identity:</strong> We don&apos;t require legal names.</li>
                        <li><strong>Your email:</strong> Not required to sign up. (You can optionally add one in Settings for notifications; that value is stored in our database.)</li>
                        <li><strong>Tracking cookies or analytics:</strong> No third-party analytics scripts, no advertising trackers.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">IP Addresses</h2>
                    <p className="text-muted-foreground mb-4">
                        We do not persist visitor IP addresses to any log we control. However, we extract the client IP in-memory for a few seconds at a time to rate-limit sensitive operations (signup, login, password reset, recovery-vault lookups, and invite-link lookups). The values are kept in ephemeral cache that resets when the server process recycles; they are not written to disk.
                    </p>
                    <p className="text-muted-foreground">
                        Our hosting provider (Vercel) and our database provider (Supabase) may keep standard web-server access logs that include IP addresses. These logs are outside our direct control and subject to their respective privacy policies.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Local Storage & Cookies</h2>
                    <p className="text-muted-foreground mb-4">
                        uunn does not use tracking cookies. We use your browser&apos;s local storage and session storage solely for cryptographic purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Session Storage:</strong> Your private encryption key is stored temporarily and cleared when you close the browser or log out.</li>
                        <li><strong>Authentication:</strong> A session token is used to keep you logged in. No third-party cookies are involved.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Third-Party Services</h2>
                    <p className="text-muted-foreground mb-4">
                        uunn uses the following third-party services to operate:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Supabase:</strong> Database hosting. All sensitive content is encrypted before it reaches Supabase — they cannot read your messages or documents.</li>
                        <li><strong>Google Gemini:</strong> Optional AI-assisted document drafting. Used server-side only. No message content or personal data is sent to Google.</li>
                        <li><strong>Vercel:</strong> Application hosting. Standard web server logs may be generated by the hosting provider.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Data Retention</h2>
                    <p className="text-muted-foreground mb-4">
                        Your data is stored for as long as your account exists. When you delete your account, all associated data — including memberships, messages, and documents — is permanently removed from our servers. We do not retain backup copies of deleted accounts.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Your Rights</h2>
                    <p className="text-muted-foreground mb-4">
                        You have full control over your data.
                    </p>
                    <div className="p-4 border rounded-md">
                        <h3 className="font-semibold mb-2">Delete Account</h3>
                        <p className="text-xs text-muted-foreground">
                            Permanently remove all your data from our servers. You can delete your account at any time from your <a href="/settings" className="text-primary hover:underline">Profile Settings</a>.
                        </p>
                    </div>
                </section>

            </div>
          </div>
        </div>
    );
}
