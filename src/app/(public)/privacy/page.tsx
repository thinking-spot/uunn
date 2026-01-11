export default function PrivacyPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-bold mb-4">What We Collect (Very Little)</h2>
                    <p className="text-muted-foreground mb-4">
                        We practice data minimization. We only store what is absolutely necessary to deliver the service.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li>Encrypted group metadata (to know which union you belong to).</li>
                        <li>Encrypted message metadata (timestamps, sender ID).</li>
                        <li>Account credentials (hashed passwords).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">What We DON'T Collect</h2>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Your Messages:</strong> Content is end-to-end encrypted. We cannot read it.</li>
                        <li><strong>Real Identity:</strong> We don't require legal names.</li>
                        <li><strong>Work Email:</strong> Not required unless used for optional verification.</li>
                        <li><strong>IP Addresses:</strong> We do not log visitor IP addresses.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Your Rights</h2>
                    <p className="text-muted-foreground mb-4">
                        You have full control over your data.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 border rounded-md">
                            <h3 className="font-semibold mb-2">Export Data</h3>
                            <p className="text-xs text-muted-foreground">Download all your data in a machine-readable format.</p>
                        </div>
                        <div className="p-4 border rounded-md">
                            <h3 className="font-semibold mb-2">Delete Account</h3>
                            <p className="text-xs text-muted-foreground">Permanently remove all your data from our servers.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
