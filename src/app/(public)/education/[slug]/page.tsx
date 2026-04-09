import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug, getCategoryById } from "@/data/education";
import { ArticleLayout } from "@/components/education/ArticleLayout";

export function generateStaticParams() {
    return articles.map((article) => ({
        slug: article.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return {};

    const category = getCategoryById(article.category);

    return {
        title: `${article.title} | Education Hub`,
        description: article.description,
        openGraph: {
            title: article.title,
            description: article.description,
            type: "article",
            section: category?.title,
        },
        twitter: {
            card: "summary",
            title: article.title,
            description: article.description,
        },
    };
}

export default async function EducationArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return <ArticleLayout article={article} />;
}
