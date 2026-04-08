import type { EducationArticle } from "../index";

export const authorizationCards: EducationArticle = {
    slug: "authorization-cards",
    title: "Authorization Cards",
    description:
        "What union authorization cards are, when you need them, and how to collect them securely.",
    category: "templates",
    icon: "CreditCard",
    readingTime: "4 min read",
    sections: [
        {
            heading: "What Is an Authorization Card?",
            content:
                "A union authorization card (also called an A-card) is a signed statement by a worker indicating their desire to be represented by a union. These cards serve as the foundation for formal union recognition — they prove to the NLRB or to your employer that workers actually want a union.\n\nAuthorization cards are legal documents, and signing one is a protected activity under the National Labor Relations Act. Your employer cannot punish you for signing a card, and they are not entitled to see who has signed.",
            type: "text",
        },
        {
            heading: "When and Why You Need Them",
            content:
                "Authorization cards serve two main purposes depending on your path to recognition:\n\nFor an NLRB election: You need signed cards from at least 30% of the proposed bargaining unit to file a petition with the NLRB. In practice, you should aim for well above 30% — most organizers won't file until they have 60-70% of workers signed, because some support will erode during the employer's counter-campaign.\n\nFor voluntary recognition (card check): If a majority of workers (50%+) sign authorization cards, you can present them to the employer and request voluntary recognition without an election. Some employers agree, especially when public pressure makes refusing look bad.\n\nIn both cases, the cards are your proof of support. They must be signed voluntarily and should be collected carefully.",
            type: "text",
        },
        {
            heading: "Legal Protections",
            content:
                "Signing an authorization card is protected concerted activity under Section 7 of the NLRA. This means your employer cannot legally fire you, discipline you, demote you, or retaliate against you in any way for signing a card.\n\nYour employer also has no legal right to demand to see the cards or to know who signed. The cards are submitted to the NLRB (for election petitions) or to a neutral third party (for card check verification). Management should never have access to individual cards.",
            type: "tip",
        },
        {
            heading: "Template: Authorization Card Language",
            content:
                "AUTHORIZATION FOR UNION REPRESENTATION\n\nI, the undersigned, hereby authorize [UNION NAME] to act as my collective bargaining representative for the purpose of negotiating wages, hours, and other terms and conditions of employment with [EMPLOYER NAME].\n\nName (print): ____________________________\nSignature: ____________________________\nDate: ____________________________\nJob Title / Department: ____________________________\nPhone (optional): ____________________________\nEmail (optional): ____________________________\n\nThis card is confidential and will not be shown to your employer.",
            type: "example",
        },
        {
            heading: "How to Collect Cards Securely",
            content:
                "Card collection is one of the most sensitive parts of organizing. Follow these security practices:\n\nCollect cards in person whenever possible. Face-to-face conversations are harder to surveil and allow you to answer questions and address concerns in real time.\n\nNever collect cards on company property if you can avoid it. Break rooms and parking lots on company premises may be monitored. Coffee shops, homes, and community spaces are safer.\n\nNever use company email, Slack, or any employer-controlled communication system to discuss or distribute cards. Use personal devices and encrypted communication.\n\nStore physical cards in a secure location outside of work — a locked drawer at home or a union office. Never leave them in your locker, desk, or car at work.\n\nFor digital copies, scan cards and store them using encrypted document storage. An encrypted platform ensures that even if your device is compromised, the cards remain protected.",
            type: "text",
        },
    ],
    relatedSlugs: ["going-public", "petition-templates", "concerted-activity"],
    actionItems: [
        "Print authorization cards on a personal printer",
        "Collect cards in person, never digitally on company networks",
        "Store scanned copies in encrypted document storage",
        "Don't file for an election until you have well above the 30% minimum",
    ],
};
