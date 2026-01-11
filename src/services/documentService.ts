
export interface DocumentData {
    id: string;
    userId: string;
    unionId: string;
    templateType: string;
    title: string;
    content: string;
    status: "draft" | "proposed" | "final";
    createdAt: any;
    updatedAt: any;
    metadata: {
        date: string;
        narrative: string;
        solution: string;
        voteThreshold: string;
        voteDate: string;
        memberMessage: string;
    };
}

export async function createDocument(
    userId: string,
    unionId: string,
    templateType: string,
    title: string,
    metadata: DocumentData["metadata"]
): Promise<string> {
    throw new Error("Not implemented on Supabase yet");
}

export async function updateDocument(
    docId: string,
    updates: Partial<DocumentData>
) {
    throw new Error("Not implemented on Supabase yet");
}

export async function getDocument(docId: string): Promise<DocumentData | null> {
    return null;
}

export async function getUserDocuments(userId: string): Promise<DocumentData[]> {
    return [];
}
