import Link from "next/link";
import * as Icons from "lucide-react";
import type { EducationArticle } from "@/data/education";

export function ArticleCard({ article }: { article: EducationArticle }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (Icons as any)[article.icon] as React.ComponentType<{ className?: string }> | undefined;

    return (
        <Link
            href={`/education/${article.slug}`}
            className="p-6 rounded-lg border bg-card hover:border-primary/40 transition-colors group block"
        >
            {Icon && (
                <Icon className="h-8 w-8 text-primary mb-3" />
            )}
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {article.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
                {article.description}
            </p>
            <span className="text-xs text-muted-foreground">
                {article.readingTime}
            </span>
        </Link>
    );
}
