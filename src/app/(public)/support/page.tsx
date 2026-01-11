export default function SupportPage() {
    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Support Center</h1>

            <div className="grid gap-8">
                <section>
                    <h2 className="text-xl font-bold mb-4">Getting Started</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <a href="/education" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                            <h3 className="font-semibold">Organizing 101</h3>
                            <p className="text-xs text-muted-foreground mt-1">Learn the basics of workplace organizing.</p>
                        </a>
                        <a href="/join/demo" className="block p-4 border rounded-lg hover:border-primary transition-colors">
                            <h3 className="font-semibold">Join a Union</h3>
                            <p className="text-xs text-muted-foreground mt-1">How to use invite codes.</p>
                        </a>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
                    <div className="space-y-4">
                        <details className="p-4 border rounded-lg">
                            <summary className="font-medium cursor-pointer">I lost my encryption password</summary>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Unfortunately, because we use zero-knowledge encryption, we cannot recover your encryption password. You will need to reset your account keys, which will make old messages unreadable.
                            </p>
                        </details>
                        <details className="p-4 border rounded-lg">
                            <summary className="font-medium cursor-pointer">Invite code says "Expired"</summary>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Invite codes expire for security reasons. Ask your organizer for a fresh code.
                            </p>
                        </details>
                    </div>
                </section>

                <section className="bg-muted p-6 rounded-xl text-center">
                    <h2 className="font-semibold mb-2">Still need help?</h2>
                    <p className="text-sm text-muted-foreground mb-4">Our support team is here for you.</p>
                    <a href="mailto:support@uunn.app" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90">
                        Contact Support
                    </a>
                </section>
            </div>
        </div>
    );
}
