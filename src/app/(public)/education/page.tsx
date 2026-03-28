export default function EducationPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-2">Education Hub</h1>
            <p className="text-xl text-muted-foreground mb-12">Knowledge base for worker rights and organizing.</p>

            <div className="grid gap-12">
                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">Know Your Rights</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="p-6 rounded-lg border bg-card">
                            <h3 className="font-semibold text-lg mb-2">Section 7 of the NLRA</h3>
                            <p className="text-muted-foreground text-sm mb-4">You have the right to organize and discuss working conditions.</p>
                            <button className="text-primary text-sm font-medium hover:underline">Read Guide →</button>
                        </div>
                        <div className="p-6 rounded-lg border bg-card">
                            <h3 className="font-semibold text-lg mb-2">concerted Activity</h3>
                            <p className="text-muted-foreground text-sm mb-4">What qualifies as protected activity under the law.</p>
                            <button className="text-primary text-sm font-medium hover:underline">Read Guide →</button>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">How to Organize</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</div>
                            <div>
                                <h3 className="font-semibold">Identify Issues</h3>
                                <p className="text-sm text-muted-foreground">Talk to coworkers to find common grievances.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</div>
                            <div>
                                <h3 className="font-semibold">Build a Committee</h3>
                                <p className="text-sm text-muted-foreground">Form a core group of trusted leaders.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</div>
                            <div>
                                <h3 className="font-semibold">Take Action</h3>
                                <p className="text-sm text-muted-foreground">Start with small actions to build confidence.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 border-b pb-2">Resources</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <h4 className="font-semibold mb-2">Legal Aid</h4>
                            <p className="text-xs text-muted-foreground">Find pro bono lawyers</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <h4 className="font-semibold mb-2">Templates</h4>
                            <p className="text-xs text-muted-foreground">Download petitions</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <h4 className="font-semibold mb-2">Union Directory</h4>
                            <p className="text-xs text-muted-foreground">Connect with locals</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
