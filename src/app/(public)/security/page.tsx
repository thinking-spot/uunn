export default function SecurityPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Security Model</h1>

            <div className="space-y-8">
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                    <h2 className="text-xl font-bold mb-2">End-to-End Encryption</h2>
                    <p className="text-sm">
                        uunn uses the Signal Protocol for all private and group messaging. Your messages are encrypted on your device and can only be decrypted by the intended recipient.
                    </p>
                </div>

                <section>
                    <h2 className="text-xl font-bold mb-4">Threat Model</h2>
                    <p className="text-muted-foreground mb-4">
                        We design our system assuming that the server could be compromised or subpoenaed. Even in these cases, your message content remains secure.
                    </p>
                    <h3 className="font-semibold mt-4 mb-2">What we protect against:</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>Employer surveillance of network traffic.</li>
                        <li>Database leaks or breaches.</li>
                        <li>Subpoenas for message content (we don't have it).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Best Practices</h2>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li>Use a strong, unique password.</li>
                        <li>Use a pseudonym that doesn't identify you (e.g., "Blue Jay" not "John Smith").</li>
                        <li>Do not use work devices or work WiFi networks if possible.</li>
                        <li>Verify invite codes with your coworkers in person.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Responsible Disclosure</h2>
                    <p className="text-muted-foreground text-sm">
                        If you find a security vulnerability, please report it to <a href="mailto:security@uunn.app" className="text-primary">security@uunn.app</a> using our PGP key. We offer a bug bounty for valid findings.
                    </p>
                </section>
            </div>
        </div>
    );
}
