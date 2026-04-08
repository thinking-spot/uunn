export interface ArticleSection {
    heading: string;
    content: string;
    type?: "text" | "warning" | "tip" | "checklist" | "example";
    items?: string[];
}

export interface EducationArticle {
    slug: string;
    title: string;
    description: string;
    category: CategoryId;
    icon: string;
    readingTime: string;
    sections: ArticleSection[];
    relatedSlugs?: string[];
    actionItems?: string[];
}

export type CategoryId =
    | "know-your-rights"
    | "how-to-organize"
    | "legal-aid"
    | "templates";

export interface Category {
    id: CategoryId;
    title: string;
    description: string;
    icon: string;
}

export const categories: Category[] = [
    {
        id: "know-your-rights",
        title: "Know Your Rights",
        description:
            "Understand the legal protections that support your right to organize.",
        icon: "Shield",
    },
    {
        id: "how-to-organize",
        title: "How to Organize",
        description:
            "Step-by-step guides for building power in your workplace.",
        icon: "Users",
    },
    {
        id: "legal-aid",
        title: "Legal Aid",
        description:
            "Find lawyers, file charges, and protect yourself legally.",
        icon: "Scale",
    },
    {
        id: "templates",
        title: "Templates",
        description:
            "Ready-to-use documents for petitions, demand letters, and more.",
        icon: "FileText",
    },
];

// Article imports
import { nlraSection7 } from "./articles/nlra-section-7";
import { concertedActivity } from "./articles/concerted-activity";
import { retaliationProtections } from "./articles/retaliation-protections";
import { weingartenRights } from "./articles/weingarten-rights";
import { buildingAnOrganizingCommittee } from "./articles/building-an-organizing-committee";
import { mappingYourWorkplace } from "./articles/mapping-your-workplace";
import { havingOrganizingConversations } from "./articles/having-organizing-conversations";
import { goingPublic } from "./articles/going-public";
import { findingProBonoLawyers } from "./articles/finding-pro-bono-lawyers";
import { filingAnNlrbCharge } from "./articles/filing-an-nlrb-charge";
import { whatToDoIfFired } from "./articles/what-to-do-if-fired";
import { petitionTemplates } from "./articles/petition-templates";
import { authorizationCards } from "./articles/authorization-cards";
import { demandLetters } from "./articles/demand-letters";
import { unionConstitution } from "./articles/union-constitution";
import { informalVsFormalUnions } from "./articles/informal-vs-formal-unions";

export const articles: EducationArticle[] = [
    nlraSection7,
    concertedActivity,
    retaliationProtections,
    weingartenRights,
    buildingAnOrganizingCommittee,
    mappingYourWorkplace,
    havingOrganizingConversations,
    informalVsFormalUnions,
    goingPublic,
    findingProBonoLawyers,
    filingAnNlrbCharge,
    whatToDoIfFired,
    petitionTemplates,
    authorizationCards,
    demandLetters,
    unionConstitution,
];

export function getArticleBySlug(
    slug: string
): EducationArticle | undefined {
    return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(
    categoryId: CategoryId
): EducationArticle[] {
    return articles.filter((a) => a.category === categoryId);
}

export function getCategoryById(id: CategoryId): Category | undefined {
    return categories.find((c) => c.id === id);
}
