import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import type { ArticleSection } from "@/data/education";

export function SectionRenderer({ section }: { section: ArticleSection }) {
    switch (section.type) {
        case "warning":
            return (
                <section className="space-y-3">
                    <h2 className="text-xl font-bold">{section.heading}</h2>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-sm whitespace-pre-line">
                                {section.content}
                            </p>
                            {section.items && (
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {section.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            );

        case "tip":
            return (
                <section className="space-y-3">
                    <h2 className="text-xl font-bold">{section.heading}</h2>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
                        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-sm whitespace-pre-line">
                                {section.content}
                            </p>
                            {section.items && (
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    {section.items.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            );

        case "checklist":
            return (
                <section className="space-y-3">
                    <h2 className="text-xl font-bold">{section.heading}</h2>
                    {section.content && (
                        <p className="text-muted-foreground text-sm whitespace-pre-line">
                            {section.content}
                        </p>
                    )}
                    {section.items && (
                        <ul className="space-y-2">
                            {section.items.map((item, i) => (
                                <li
                                    key={i}
                                    className="flex gap-2 items-start text-sm"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            );

        case "example":
            return (
                <section className="space-y-3">
                    <h2 className="text-xl font-bold">{section.heading}</h2>
                    <div className="bg-muted rounded-lg p-4 border">
                        <p className="text-sm whitespace-pre-line font-mono">
                            {section.content}
                        </p>
                    </div>
                </section>
            );

        default:
            return (
                <section className="space-y-3">
                    <h2 className="text-xl font-bold">{section.heading}</h2>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">
                        {section.content}
                    </p>
                    {section.items && (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {section.items.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    )}
                </section>
            );
    }
}
