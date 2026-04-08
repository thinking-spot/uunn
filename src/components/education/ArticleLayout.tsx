import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { EducationArticle } from "@/data/education";
import { getArticleBySlug, getCategoryById } from "@/data/education";
import { Disclaimer } from "./Disclaimer";
import { SectionRenderer } from "./SectionRenderer";

export function ArticleLayout({ article }: { article: EducationArticle }) {
    const category = getCategoryById(article.category);
    const relatedArticles = (article.relatedSlugs ?? [])
        .map(getArticleBySlug)
        .filter(Boolean) as EducationArticle[];

    return (
        <div className="container max-w-3xl mx-auto py-12 px-4">
            <Link
                href="/education"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Education Hub
            </Link>

            {category && (
                <p className="text-sm text-primary font-medium mb-2">
                    {category.title}
                </p>
            )}
            <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">
                {article.readingTime}
            </p>

            <Disclaimer />

            <div className="mt-8 space-y-8">
                {article.sections.map((section, i) => (
                    <SectionRenderer key={i} section={section} />
                ))}
            </div>

            {article.actionItems && article.actionItems.length > 0 && (
                <div className="mt-10 bg-primary/5 border border-primary/20 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">Action Items</h2>
                    <ul className="space-y-2">
                        {article.actionItems.map((item, i) => (
                            <li
                                key={i}
                                className="flex gap-2 items-start text-sm"
                            >
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {relatedArticles.length > 0 && (
                <div className="mt-10 pt-8 border-t">
                    <h2 className="text-lg font-bold mb-4">
                        Related Articles
                    </h2>
                    <div className="grid gap-3">
                        {relatedArticles.map((related) => (
                            <Link
                                key={related.slug}
                                href={`/education/${related.slug}`}
                                className="p-4 rounded-lg border hover:border-primary/40 transition-colors block"
                            >
                                <h3 className="font-semibold text-sm">
                                    {related.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {related.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
