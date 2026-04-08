import type { EducationArticle } from "../index";

export const unionConstitution: EducationArticle = {
    slug: "union-constitution",
    title: "Union Constitution and Bylaws",
    description:
        "How to draft a constitution that governs your union's structure, elections, and decision-making.",
    category: "templates",
    icon: "ScrollText",
    readingTime: "6 min read",
    sections: [
        {
            heading: "What Is a Union Constitution?",
            content:
                "A union constitution (sometimes called bylaws or a charter) is the governing document of your union. It defines how your union operates — who can be a member, how leaders are elected, how decisions are made, and how the organization can change over time.\n\nEvery democratic organization needs a constitution. Without one, decisions get made informally by whoever has the most influence, and there's no accountability. A well-drafted constitution ensures that your union belongs to its members, not to any individual leader or faction.\n\nYou'll need a constitution once your union is certified (or if you're forming an independent union). It should be drafted collaboratively, reviewed by all members, and adopted by majority vote.",
            type: "text",
        },
        {
            heading: "Key Sections to Include",
            content:
                "A comprehensive union constitution should cover the following areas. Each section should be clear enough that any member can understand their rights and obligations without needing a lawyer to interpret the document.",
            type: "checklist",
            items: [
                "Name and Purpose — The official name of the union and a statement of its mission (e.g., to represent workers at [employer] in collective bargaining and to advance their interests)",
                "Membership Eligibility — Who can join, how they join, and under what circumstances membership can be revoked (keep this broad and inclusive)",
                "Officer Positions and Elections — What leadership positions exist (president, secretary, treasurer, stewards), their responsibilities, term lengths, and how elections are conducted",
                "Meeting Procedures — How often general membership meetings are held, quorum requirements, how special meetings are called, and basic rules of order",
                "Dues Structure — How much members pay, how dues are collected, how funds are managed, and who has authority over spending (transparency is essential)",
                "Grievance Procedures — How workplace grievances are reported, investigated, and pursued by the union on behalf of members",
                "Amendment Process — How the constitution itself can be changed (typically requires a supermajority vote of the membership)",
                "Ratification Clause — How contracts negotiated with the employer must be approved by the membership before taking effect",
            ],
        },
        {
            heading: "Template: Constitution Outline",
            content:
                "CONSTITUTION OF [UNION NAME]\n\nARTICLE I — NAME AND PURPOSE\nSection 1. This organization shall be known as [UNION NAME].\nSection 2. The purpose of this organization is to represent the employees of [EMPLOYER] in matters relating to wages, hours, and working conditions; to engage in collective bargaining; and to promote the general welfare of its members.\n\nARTICLE II — MEMBERSHIP\nSection 1. All employees of [EMPLOYER] within the bargaining unit defined by [NLRB certification / voluntary agreement] are eligible for membership.\nSection 2. Membership shall commence upon signing a membership card and paying initial dues.\nSection 3. Members may be removed only by a two-thirds vote of the membership for cause, after notice and an opportunity to be heard.\n\nARTICLE III — OFFICERS\nSection 1. The officers of this union shall be: President, Vice President, Secretary, Treasurer, and [NUMBER] Stewards.\nSection 2. Officers shall be elected by secret ballot of the membership and shall serve terms of [LENGTH, e.g., one year].\nSection 3. Elections shall be held annually in [MONTH]. All members in good standing are eligible to run for office.\nSection 4. Officers may be recalled by a two-thirds vote of the membership.\n\nARTICLE IV — MEETINGS\nSection 1. General membership meetings shall be held [FREQUENCY, e.g., monthly on the first Tuesday].\nSection 2. A quorum of [PERCENTAGE, e.g., 25%] of members in good standing is required for official business.\nSection 3. Special meetings may be called by the President, by a majority of officers, or by petition of [PERCENTAGE] of the membership.\n\nARTICLE V — DUES AND FINANCES\nSection 1. Monthly dues shall be [AMOUNT OR FORMULA].\nSection 2. The Treasurer shall maintain financial records and present a report at each general membership meeting.\nSection 3. Expenditures exceeding [AMOUNT] require approval by majority vote of the membership.\nSection 4. An annual financial audit shall be conducted by [COMMITTEE / INDEPENDENT AUDITOR].\n\nARTICLE VI — COLLECTIVE BARGAINING\nSection 1. The bargaining committee shall be elected by the membership.\nSection 2. No collective bargaining agreement shall take effect unless ratified by a majority vote of the membership by secret ballot.\n\nARTICLE VII — GRIEVANCES\nSection 1. Any member may file a grievance with a union steward.\nSection 2. The grievance committee shall investigate and determine whether to pursue the grievance on the member's behalf.\n\nARTICLE VIII — AMENDMENTS\nSection 1. This constitution may be amended by a two-thirds vote of members present at a general membership meeting, provided that the proposed amendment was distributed to all members at least [DAYS] days in advance.\n\nARTICLE IX — RATIFICATION\nThis constitution shall take effect upon ratification by a majority vote of eligible bargaining unit members.",
            type: "example",
        },
        {
            heading: "Democratic Principles",
            content:
                "The strength of your union depends on genuine democratic governance. Build these principles into every part of your constitution:\n\nRegular elections ensure accountability. No officer should serve indefinitely. Term limits and annual elections give members the power to change leadership if it's not working.\n\nTransparent finances build trust. Every member should be able to see how dues money is spent. Regular financial reports and independent audits prevent corruption and suspicion.\n\nMember ratification of contracts is non-negotiable. The bargaining committee negotiates on behalf of members, but the members themselves must vote to accept or reject any deal. Never let a small group bind the entire membership to a contract they haven't approved.\n\nLow barriers to participation keep the union accessible. Meeting times should rotate to accommodate different shifts. Voting should be available to all members, including those who can't attend in person — encrypted digital voting tools can help ensure every voice is heard.",
            type: "text",
        },
        {
            heading: "How to Adopt Your Constitution",
            content:
                "Drafting and adopting a constitution is a multi-step process that should involve as many members as possible:\n\nFirst, form a bylaws committee of 3-5 members representing different departments and shifts. This committee drafts the initial version. Review sample constitutions from similar unions in your industry — many are publicly available online, and established unions will often share theirs.\n\nOnce a draft is ready, circulate it to all members with enough time for review (at least two weeks). Hold a meeting specifically to discuss the draft, take questions, and propose amendments.\n\nAfter discussion and revisions, hold a ratification vote. This should be a formal secret-ballot vote open to all eligible members. A simple majority is sufficient for initial adoption.\n\nYour constitution is a living document. As your union grows and evolves, you'll amend it. The amendment process you define should be achievable but not too easy — a two-thirds supermajority requirement prevents hasty changes while still allowing the document to evolve.",
            type: "text",
        },
    ],
    relatedSlugs: ["going-public", "authorization-cards"],
    actionItems: [
        "Form a bylaws drafting committee with representation from all departments",
        "Review sample constitutions from similar unions in your industry",
        "Draft and circulate for member feedback for at least two weeks",
        "Hold a ratification vote open to all eligible members",
    ],
};
