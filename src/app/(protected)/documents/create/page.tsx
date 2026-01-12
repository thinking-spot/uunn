"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Save, Send, Wand2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createDocumentAction, updateDocumentAction, getDocumentAction } from "@/lib/document-actions";
import { generateDocumentDraft } from "@/lib/gemini";
import { getUserUnions, Union } from "@/lib/client-actions/unions";
import { cn } from "@/lib/utils";

function WizardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const templateId = searchParams.get("template");
    const docId = searchParams.get("id");

    const [step, setStep] = useState(docId ? 3 : 1);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [unions, setUnions] = useState<Union[]>([]);
    const [selectedUnionId, setSelectedUnionId] = useState("");

    // Form inputs
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narrative, setNarrative] = useState("");
    const [solution, setSolution] = useState("");
    const [voteThreshold, setVoteThreshold] = useState("Simple Majority");

    // Editor content
    const [content, setContent] = useState("");

    useEffect(() => {
        if (user) {
            getUserUnions(user.uid).then(data => {
                setUnions(data);
                if (data.length > 0) setSelectedUnionId(data[0].id);
            });
        }
    }, [user]);

    // If editing existing doc, load it
    useEffect(() => {
        if (docId) {
            setLoading(true);
            getDocumentAction(docId).then(({ document: doc }) => {
                if (doc) {
                    setTitle(doc.title);
                    setContent(doc.content);
                    // Mock metadata load from DB or just assume defaults for MVP as schema is simple
                    // The simple DB schema just has title/content
                }
                setLoading(false);
            });
        }
    }, [docId]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const unionName = unions.find(u => u.id === selectedUnionId)?.name;
            const draft = await generateDocumentDraft(templateId || "generic", {
                title,
                date,
                narrative,
                solution,
                voteThreshold,
                voteDate: "",
                memberMessage: "",
                unionName
            });
            setContent(draft);
            setStep(3); // Move to editor
        } catch (error) {
            console.error(error);
            alert("Failed to generate draft");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!user || !selectedUnionId) return;
        setLoading(true);
        try {
            const metadata = { date, narrative, solution, voteThreshold, voteDate: "", memberMessage: "" };
            if (docId) {
                await updateDocumentAction(docId, content);
            } else {
                const result = await createDocumentAction(selectedUnionId, title, content);
                if (result.error || !result.document) throw new Error(result.error);
                router.replace(`/documents/create?id=${result.document.id}`);
            }
            alert("Document saved!");
            router.push("/documents");
        } catch (error) {
            alert("Failed to save");
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Progress Header */}
            <div className="border-b px-8 py-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="font-bold">Create Document</h1>
                </div>
                <div className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <span className={cn(step === 1 && "text-primary font-bold")}>1. Setup</span>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                    <span className={cn(step === 2 && "text-primary font-bold")}>2. AI Draft</span>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                    <span className={cn(step === 3 && "text-primary font-bold")}>3. Edit & Finalize</span>
                </div>
                <div className="w-8" /> {/* Spacer */}
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-8 overflow-y-auto">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold">Document Setup</h2>
                            <p className="text-muted-foreground">Configure the basics for your {templateId} document.</p>
                        </div>

                        <div className="grid gap-6 bg-card p-6 rounded-xl border">
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Union</label>
                                <select
                                    className="w-full rounded-md border px-3 py-2"
                                    value={selectedUnionId}
                                    onChange={e => setSelectedUnionId(e.target.value)}
                                >
                                    {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    className="w-full rounded-md border px-3 py-2"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Petition for Better Lighting"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!title}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium flex items-center gap-2"
                            >
                                Next Step <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold">AI Assistance</h2>
                            <p className="text-muted-foreground">Provide context so our AI can draft this for you.</p>
                        </div>

                        <div className="grid gap-6 bg-card p-6 rounded-xl border">
                            <div>
                                <label className="block text-sm font-medium mb-2">Narrative / Context</label>
                                <textarea
                                    className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                                    value={narrative}
                                    onChange={e => setNarrative(e.target.value)}
                                    placeholder="Describe the problem, verify facts, etc..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Proposed Solution</label>
                                <textarea
                                    className="w-full rounded-md border px-3 py-2 min-h-[80px]"
                                    value={solution}
                                    onChange={e => setSolution(e.target.value)}
                                    placeholder="What action do you want management to take?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => setStep(1)} className="text-muted-foreground">Back</button>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(3)} className="px-4 py-2 border rounded-md">Skip AI</button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !narrative}
                                    className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium flex items-center gap-2"
                                >
                                    {generating ? <Loader2 className="animate-spin h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                                    Generate Draft
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="h-full flex flex-col animate-in slide-in-from-right-4">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold">Review & Finalize</h2>
                        </div>

                        <textarea
                            className="flex-1 w-full rounded-xl border p-6 font-mono text-sm leading-relaxed resize-none focus:outline-primary mb-6"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Document content..."
                        />

                        <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
                            <button onClick={() => setStep(2)} className="text-muted-foreground">Back to inputs</button>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 rounded-md border border-primary text-primary font-medium hover:bg-primary/5"
                                >
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Draft"}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-primary/90"
                                >
                                    <Send className="h-4 w-4" /> Finalize & Propose
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CreateDocumentPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <WizardContent />
        </Suspense>
    );
}
