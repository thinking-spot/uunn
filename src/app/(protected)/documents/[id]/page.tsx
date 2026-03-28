'use client';

import { useState, useEffect } from "react";
import { useUnion } from "@/context/UnionContext";
import { getDecryptedDocument, updateEncryptedDocument, DecryptedDocument } from "@/lib/client-actions/documents";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { activeUnion, unions } = useUnion();
    const [doc, setDoc] = useState<DecryptedDocument | null>(null);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [docId, setDocId] = useState<string>("");

    useEffect(() => {
        params.then(p => {
            setDocId(p.id);
        });
    }, []);

    useEffect(() => {
        if (docId && unions.length > 0) {
            loadDoc(docId);
        }
    }, [docId, unions]);

    const getEncryptionKeyForDoc = (unionId: string): string | null => {
        const union = unions.find(u => u.id === unionId);
        return union?.encryptionKey || null;
    };

    const loadDoc = async (id: string) => {
        // First fetch raw doc to get union_id, then decrypt with the right key
        const { getDocumentAction } = await import("@/lib/document-actions");
        const rawResult = await getDocumentAction(id);
        if (!rawResult.document) {
            setLoading(false);
            return;
        }

        const encKey = getEncryptionKeyForDoc(rawResult.document.union_id);
        if (!encKey) {
            setDoc({ id: rawResult.document.id, title: rawResult.document.title, content: '[No encryption key available]', union_id: rawResult.document.union_id, updated_at: rawResult.document.updated_at });
            setContent('[No encryption key available]');
            setLoading(false);
            return;
        }

        const result = await getDecryptedDocument(id, encKey);
        if (result.document) {
            setDoc(result.document);
            setContent(result.document.content);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!docId || !doc) return;
        const encKey = getEncryptionKeyForDoc(doc.union_id);
        if (!encKey) {
            toast.error("No encryption key available");
            return;
        }
        setSaving(true);
        const result = await updateEncryptedDocument(docId, content, encKey);
        if (result.error) toast.error(result.error);
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
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" /> End-to-end encrypted
                        </p>
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
