'use client';

import { useState, useEffect } from "react";
import { getDocumentAction, updateDocumentAction, Document } from "@/lib/document-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const [doc, setDoc] = useState<Document | null>(null);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [docId, setDocId] = useState<string>("");

    useEffect(() => {
        params.then(p => {
            setDocId(p.id);
            loadDoc(p.id);
        });
    }, []);

    const loadDoc = async (id: string) => {
        const { document, error } = await getDocumentAction(id);
        if (document) {
            setDoc(document);
            setContent(document.content);
        } else {
            alert(error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!docId) return;
        setSaving(true);
        const { error } = await updateDocumentAction(docId, content);
        if (error) alert(error);
        setSaving(false);
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!doc) return <div className="p-8">Document not found</div>;

    return (
        <div className="flex flex-col h-screen max-h-screen">
            <header className="border-b p-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                    <Link href="/documents">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg">{doc.title}</h1>
                        <p className="text-xs text-muted-foreground">Autosave disabled (Manual Save)</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </header>

            <main className="flex-1 p-4 md:p-8 bg-muted/10 overflow-auto">
                <textarea
                    className="w-full h-full max-w-4xl mx-auto p-6 bg-card border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Start typing your markdown here..."
                />
            </main>
        </div>
    );
}
