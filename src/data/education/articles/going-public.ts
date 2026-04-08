import type { EducationArticle } from "../index";

export const goingPublic: EducationArticle = {
    slug: "going-public",
    title: "Going Public and Next Steps",
    description:
        "When and how to announce your union effort, and what comes after.",
    category: "how-to-organize",
    icon: "Megaphone",
    readingTime: "7 min read",
    sections: [
        {
            heading: "When to Go Public",
            content:
                "Going public means formally announcing to your employer and coworkers that you are organizing a union. This is one of the most consequential decisions your committee will make, and timing matters enormously.\n\nThe general rule is to wait until you have supermajority support — at least 65-70% of your coworkers have clearly indicated they want a union. Why so high? Because once you go public, management will launch a counter-campaign designed to erode support. Starting from a simple majority (51%) leaves almost no margin. Starting from a supermajority means you can lose some support and still win.\n\nBefore going public, verify your numbers. Don't rely on assumptions or casual conversations. Use your workplace map to confirm that supporters have explicitly committed, not just expressed vague sympathy. Your committee should be representative of every shift, department, and demographic in the workplace.",
            type: "text",
        },
        {
            heading: "Do Not Go Public Prematurely",
            content:
                "One of the most common mistakes in organizing is going public before you have the numbers. Once management knows about your effort, they will respond aggressively. If you don't have supermajority support locked in, the counter-campaign can be devastating — not just for the union vote, but for the morale and safety of your committee members.\n\nIf you're unsure about your numbers, keep organizing. There is no deadline forcing you to go public. Take the time to have more conversations, strengthen your committee, and build deeper support.",
            type: "warning",
        },
        {
            heading: "Methods of Formal Recognition",
            content:
                "There are several paths to union recognition, each with different implications:\n\nNLRB Election: You file a petition with the National Labor Relations Board showing that at least 30% of workers support an election (typically via signed authorization cards). The NLRB schedules a secret-ballot election. If a majority of voters choose the union, the NLRB certifies it and your employer is legally required to bargain with you. This is the most common path.\n\nVoluntary Recognition (Card Check): If a majority of workers (50%+) sign authorization cards, you can ask the employer to voluntarily recognize the union without an election. Some employers agree to this, especially under public pressure. Others refuse, forcing an NLRB election.\n\nCollective Action Without Formal Union: You don't need a certified union to take collective action. Workers can organize around specific demands — safety improvements, scheduling changes, pay raises — using petitions, demand letters, and coordinated pressure. This approach is fully protected under the NLRA as concerted activity.",
            type: "text",
        },
        {
            heading: "What to Expect from Management",
            content:
                "Once you go public, expect management to push back. This is not speculation — it happens in the vast majority of organizing campaigns. Understanding their playbook helps you prepare.\n\nCommon employer tactics include captive audience meetings (mandatory meetings where management presents anti-union arguments), hiring \"union avoidance\" consultants (a multi-billion dollar industry), one-on-one conversations with supervisors designed to intimidate or persuade, sudden improvements to working conditions (meant to undermine the case for a union), and spreading misinformation about union dues, strikes, or job security.\n\nAll of this is predictable and manageable if your committee is prepared. The key strategy is called \"inoculation\" — telling your coworkers in advance exactly what management will do, so that when it happens, it confirms your credibility rather than shaking their support.",
            type: "text",
        },
        {
            heading: "The NLRB Election Process",
            content:
                "If you pursue an NLRB election, here's the step-by-step process:\n\n1. File a petition with your regional NLRB office, accompanied by authorization cards or signatures from at least 30% of the bargaining unit.\n2. The NLRB investigates to confirm sufficient interest and determines the appropriate bargaining unit (which workers are included).\n3. A pre-election hearing may be held if there are disputes about the bargaining unit.\n4. The NLRB schedules a secret-ballot election, typically within a few weeks.\n5. During the campaign period, both the union and management can communicate with workers, but there are rules about what employers can and cannot say or do.\n6. On election day, workers vote by secret ballot. A simple majority of votes cast (not of all eligible workers) wins.\n7. If the union wins, the NLRB certifies it as the exclusive bargaining representative.\n\nThe entire process from petition to election typically takes 3-8 weeks.",
            type: "text",
        },
        {
            heading: "After Certification: Bargaining Your First Contract",
            content:
                "Winning the election is a major victory, but it's not the finish line. The next phase is bargaining your first collective bargaining agreement (contract) with the employer.\n\nYour employer is legally required to bargain in good faith, but that doesn't mean they'll make it easy. First contracts typically take 6-12 months to negotiate. During this period, maintain your organizing infrastructure — keep your committee active, continue communicating with all workers, and be prepared to use collective action (informational picketing, work-to-rule, or other pressure tactics) to push bargaining forward.\n\nKey areas to negotiate include wages and raises, benefits (health insurance, retirement, PTO), working conditions and safety, grievance procedures, seniority systems, and union security clauses. Your committee should survey all members to understand their priorities before bargaining begins.",
            type: "text",
        },
    ],
    relatedSlugs: [
        "having-organizing-conversations",
        "authorization-cards",
        "union-constitution",
    ],
    actionItems: [
        "Do not go public until you have 65%+ confirmed support",
        "Prepare your committee for management's counter-campaign",
        "Decide your path: NLRB election, voluntary recognition, or collective action",
        "File with the NLRB when your support is solid",
    ],
};
