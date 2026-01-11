
export interface Issue {
    id: string;
    unionId: string;
    creatorId: string;
    title: string;
    description: string;
    status: "active" | "draft" | "passed" | "failed";
    votesFor: string[]; // Array of user IDs
    votesAgainst: string[]; // Array of user IDs
    threshold: "simple" | "two-thirds" | "unanimous";
    deadline: any;
    createdAt: any;
}

export async function createIssue(
    unionId: string,
    creatorId: string,
    data: {
        title: string;
        description: string;
        threshold: Issue["threshold"];
        deadline: string;
    }
): Promise<string> {
    throw new Error("Not implemented on Supabase yet");
}

export async function getUnionIssues(unionId: string): Promise<Issue[]> {
    return [];
}

export async function voteOnIssue(issueId: string, userId: string, vote: "for" | "against") {
    throw new Error("Not implemented on Supabase yet");
}
