'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnion } from "@/context/UnionContext";
import { getDecryptedUnionDocuments, DecryptedDocument, createEncryptedDocument } from "@/lib/client-actions/documents";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { TEMPLATES, getTemplate } from "@/lib/document-templates";

export default function DocumentsPage() {
    const router = useRouter();
    const { activeUnion } = useUnion();
    const [documents, setDocuments] = useState<DecryptedDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("basic");
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (activeUnion) {
            loadDocs();
        }
    }, [activeUnion]);

    const loadDocs = async () => {
        if (!activeUnion?.encryptionKey) return;
        setLoading(true);
        const docs = await getDecryptedUnionDocuments(activeUnion.id, activeUnion.encryptionKey);
        setDocuments(docs);
        setLoading(false);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setFieldValues({});
    };

    const handleFieldChange = (fieldId: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleCreate = async () => {
        if (!activeUnion?.encryptionKey || !newTitle) return;
        const template = getTemplate(selectedTemplateId);
        if (!template) return;

        setCreating(true);
        try {
            const markdownContent = template.generateMarkdown(newTitle, fieldValues);
            const result = await createEncryptedDocument(activeUnion.id, newTitle, markdownContent, activeUnion.encryptionKey);
            if (result.error) {
                toast.error(result.error);
            } else if (result.document) {
                setIsCreating(false);
                setNewTitle("");
                setFieldValues({});
                setSelectedTemplateId("basic");
                router.push(`/documents/${result.document.id}`);
            }
        } catch {
            toast.error("Error creating document");
        } finally {
            setCreating(false);
        }
    };

    const selectedTemplate = getTemplate(selectedTemplateId);

    if (!activeUnion) {
        return <div className="p-8 text-center text-muted-foreground">Select a union to view documents.</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> End-to-end encrypted
                    </p>
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
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Document Title</label>
                            <input
                                placeholder="Document Title (e.g. Safety Demands)"
                                className="w-full p-2 border rounded"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Select Template</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedTemplateId}
                                onChange={e => handleTemplateChange(e.target.value)}
                            >
                                {TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            {selectedTemplate && (
                                <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>
                            )}
                        </div>

                        {selectedTemplate && selectedTemplate.fields.map(field => (
                            <div key={field.id}>
                                <label className="block text-sm font-medium mb-1">{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        className="w-full p-2 border rounded min-h-[80px] resize-y"
                                        placeholder={field.placeholder}
                                        value={fieldValues[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                    />
                                ) : (
                                    <input
                                        className="w-full p-2 border rounded"
                                        placeholder={field.placeholder}
                                        value={fieldValues[field.id] || ''}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setIsCreating(false); setFieldValues({}); setSelectedTemplateId("basic"); }}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newTitle || creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
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
