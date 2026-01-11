import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateDocumentDraft(
    templateType: string,
    data: {
        title: string;
        date: string;
        narrative: string;
        solution: string;
        voteThreshold: string;
        voteDate: string;
        memberMessage: string;
        unionName?: string;
    }
): Promise<string> {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    You are an expert union organizer and legal aide. Draft a formal "${templateType}" document based on the following details:

    Title: ${data.title}
    Date: ${data.date}
    Union Name: ${data.unionName || "[Union Name]"}
    
    Context/Narrative:
    ${data.narrative}

    Desired Solution/Demand:
    ${data.solution}

    Vote Threshold: ${data.voteThreshold}
    Proposed Vote Date: ${data.voteDate}
    Message to Members: ${data.memberMessage}

    Instructions:
    - Format the output as a professional, formal document suitable for the specific template type.
    - Use clear, strong, and legally sound language (where applicable, but do not provide legal advice).
    - If it's a letter, include standard header/footer placeholders.
    - If it's a petition, include a section for signatures.
    - Return ONLY the document content, no conversational filler.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini generation error:", error);
        throw new Error("Failed to generate document");
    }
}
