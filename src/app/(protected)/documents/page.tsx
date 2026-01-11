'use client';

import { useState, useEffect } from "react";
import { useUnion } from "@/context/UnionContext";
import { createDocumentAction, getUnionDocumentsAction, Document } from "@/lib/document-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
    const { activeUnion } = useUnion();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    useEffect(() => {
        if (activeUnion) {
            loadDocs();
        }
    }, [activeUnion]);

    const loadDocs = async () => {
        if (!activeUnion) return;
        setLoading(true);
        const { documents: data, error } = await getUnionDocumentsAction(activeUnion.id);
        if (data) setDocuments(data);
        if (error) console.error(error);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!activeUnion || !newTitle) return;
        try {
            const { error } = await createDocumentAction(activeUnion.id, newTitle);
            if (error) alert(error);
            else {
                setIsCreating(false);
                setNewTitle("");
                loadDocs();
            }
        } catch (e) {
            alert("Error creating document");
        }
    };

    if (!activeUnion) {
        return <div className="p-8 text-center text-muted-foreground">Select a union to view documents.</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground">Collaborative notes, demand letters, and minutes.</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="mr-2 h-4 w-4" /> New Document
                </Button>
            </div>

            {isCreating && (
                <Card className="mb-8 border-primary/20">
                    <CardHeader>
                        <CardTitle>Create New Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            placeholder="Document Title (e.g. Safety Demands)"
                            className="w-full p-2 border rounded"
                            value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        />
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map(doc => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}>
                        <Card className="hover:bg-accent hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <FileText className="h-8 w-8 text-primary mb-2" />
                                <CardTitle className="text-lg">{doc.title}</CardTitle>
                                <CardDescription>Last updated: {new Date(doc.updated_at).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-3">
                                    {doc.content || "Empty document"}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
