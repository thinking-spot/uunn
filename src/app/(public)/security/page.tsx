import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Security Model",
    description: "uunn uses AES-256 and RSA-2048 encryption to protect all union data. Zero-knowledge architecture means we can never read your content.",
};

export default function SecurityPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Security Model</h1>

            <div className="space-y-8">
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold mb-2">End-to-End Encryption</h2>
                    <p className="text-sm">
                        uunn encrypts all messages, documents, and votes on your device using the Web Crypto API before they leave your browser. The server only stores ciphertext — we can never read your content.
                    </p>
                </div>

                <section>
                    <h2 className="text-xl font-bold mb-4">How It Works</h2>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="p-4 border rounded-md">
                            <h3 className="font-semibold text-foreground mb-1">Key Exchange — RSA-OAEP (2048-bit)</h3>
                            <p>Each user generates an RSA key pair in their browser. The public key is stored on the server; the private key never leaves your device. When you join a union, the union&apos;s shared key is encrypted with your public key so only you can unlock it.</p>
                        </div>
                        <div className="p-4 border rounded-md">
                            <h3 className="font-semibold text-foreground mb-1">Content Encryption — AES-GCM (256-bit)</h3>
                            <p>Each union has a shared AES-256 key. All messages and documents are encrypted with this key using AES-GCM with a unique 96-bit initialization vector (IV) per message, ensuring that identical messages produce different ciphertexts.</p>
                        </div>
                        <div className="p-4 border rounded-md">
                            <h3 className="font-semibold text-foreground mb-1">Key Backup — PBKDF2 (100,000 iterations)</h3>
                            <p>Your private key can be backed up in an encrypted vault protected by your password. The password is never sent to the server — a key is derived locally using PBKDF2 with SHA-256 and used to encrypt the vault.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Zero-Knowledge Architecture</h2>
                    <p className="text-muted-foreground mb-4">
                        uunn is designed so that the server never has access to plaintext content. Even if the database is compromised or subpoenaed, message content remains encrypted and unreadable.
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>All encryption and decryption happens client-side in your browser.</li>
                        <li>Private keys are stored in session storage and cleared on logout.</li>
                        <li>Passwords are hashed with bcrypt before storage — we never see plaintext passwords.</li>
                        <li>No analytics, no IP logging, no tracking cookies.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Threat Model</h2>
                    <p className="text-muted-foreground mb-4">
                        We design our system assuming that the server could be compromised or subpoenaed. Even in these cases, your message content remains secure.
                    </p>
                    <h3 className="font-semibold mt-4 mb-2">What we protect against:</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>Employer surveillance of network traffic.</li>
                        <li>Database leaks or breaches.</li>
                        <li>Subpoenas for message content (we don&apos;t have it).</li>
                        <li>Man-in-the-middle attacks (HSTS enforced, TLS required).</li>
                    </ul>
                    <h3 className="font-semibold mt-4 mb-2">Limitations:</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>We cannot protect against a compromised device (e.g., keyloggers, screen capture).</li>
                        <li>Metadata (who is in which union, message timestamps) is visible to the server, though not to external observers.</li>
                        <li>If you lose your password and private key, your data cannot be recovered.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Open Source</h2>
                    <p className="text-muted-foreground text-sm">
                        uunn is open source. You can inspect the cryptographic implementation, verify our claims, and audit the code yourself. We believe transparency is essential to trust.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Best Practices</h2>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li>Use a strong, unique password.</li>
                        <li>Use a pseudonym that doesn&apos;t identify you (e.g., &quot;Blue Jay&quot; not &quot;John Smith&quot;).</li>
                        <li>Do not use work devices or work WiFi networks if possible.</li>
                        <li>Verify invite codes with your coworkers in person.</li>
                        <li>Log out when you&apos;re done — this clears your private key from the browser.</li>
                    </ul>
                </section>

            </div>
        </div>
    );
}
