import type { Metadata } from "next";
import { categories, getArticlesByCategory } from "@/data/education";
import { ArticleCard } from "@/components/education/ArticleCard";
import { Disclaimer } from "@/components/education/Disclaimer";
import * as Icons from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconMap = any;

export const metadata: Metadata = {
    title: "Education Hub | Worker Rights & Organizing",
    description:
        "Learn about your rights as a worker. Guides on NLRA Section 7, concerted activity, organizing strategies, legal aid, and templates for petitions and demand letters.",
    openGraph: {
        title: "Education Hub | Worker Rights & Organizing | uunn",
        description:
            "Learn about your rights as a worker. Guides on NLRA Section 7, concerted activity, organizing strategies, legal aid, and templates for petitions and demand letters.",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Education Hub | Worker Rights & Organizing | uunn",
        description:
            "Learn about your rights as a worker. Guides on NLRA Section 7, concerted activity, organizing strategies, legal aid, and templates for petitions and demand letters.",
    },
};

export default function EducationPage() {
    return (
        <div className="w-full px-4 md:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Education Hub</h1>
            <p className="text-xl text-muted-foreground mb-8">
                Knowledge base for worker rights and organizing.
            </p>

            <Disclaimer />

            <div className="mt-12 grid gap-14">
                {categories.map((category) => {
                    const categoryArticles = getArticlesByCategory(
                        category.id
                    );
                    const Icon = (Icons as IconMap)[category.icon] as
                        | React.ComponentType<{ className?: string }>
                        | undefined;

                    return (
                        <section key={category.id}>
                            <div className="flex items-center gap-3 mb-2">
                                {Icon && (
                                    <Icon className="h-6 w-6 text-primary" />
                                )}
                                <h2 className="text-2xl font-bold">
                                    {category.title}
                                </h2>
                            </div>
                            <p className="text-muted-foreground text-sm mb-6 border-b pb-4">
                                {category.description}
                            </p>
                            <div className="grid gap-6 md:grid-cols-2">
                                {categoryArticles.map((article) => (
                                    <ArticleCard
                                        key={article.slug}
                                        article={article}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
          </div>
        </div>
    );
}
