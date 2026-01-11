"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Trash2, Loader2, FilePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserDocuments, DocumentData } from "@/services/documentService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import ProtectedRoute from "@/components/ProtectedRoute";

const TEMPLATES = [
    { id: "petition", name: "Petition for Change", description: "Collect signatures for a specific workplace demand." },
    { id: "grievance", name: "Formal Grievance", description: "Official complaint regarding contract violation." },
    { id: "contract", name: "Contract Proposal", description: "Draft language for upcoming bargaining sessions." },
    { id: "email", name: "Management Email", description: "Professional communication to supervisors." },
    { id: "alliance", name: "Inter-Union Alliance", description: "Propose an alliance or joint action." },
    { id: "safety", name: "Safety Incident Report", description: "Formal documentation of workplace hazards." },
];

export default function DocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getUserDocuments(user.uid).then(docs => {
                setDocuments(docs);
                setLoading(false);
            });
        }
    }, [user]);

    const handleCreate = (templateId: string) => {
        router.push(`/documents/create?template=${templateId}`);
    };

    return (
        <ProtectedRoute>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                        <p className="text-muted-foreground">Create and manage union documents.</p>
                    </div>
                </div>

                <Tabs defaultValue="my-docs" className="w-full">
                    <TabsList className="mb-8">
                        <TabsTrigger value="my-docs">My Documents</TabsTrigger>
                        <TabsTrigger value="templates">New Document</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-docs">
                        {loading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                        ) : documents.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-12 text-center">
                                <p className="text-muted-foreground mb-4">You haven't created any documents yet.</p>
                                <button
                                    onClick={() => (document.querySelector('[data-value="templates"]') as HTMLElement)?.click()}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Document
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {documents.map(doc => (
                                    <div key={doc.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/documents/${doc.id}`)}>
                                        <div className="flex items-start justify-between">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${doc.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {doc.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 font-semibold text-lg truncate">{doc.title}</h3>
                                        <p className="text-sm text-muted-foreground">{doc.templateType}</p>
                                        <div className="mt-4 text-xs text-muted-foreground">
                                            Last updated: {doc.updatedAt?.seconds ? new Date(doc.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="templates">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {TEMPLATES.map(template => (
                                <div
                                    key={template.id}
                                    className="group relative rounded-xl border bg-card p-6 shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => handleCreate(template.id)}
                                >
                                    <div className="h-12 w-12 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-4">
                                        <FilePlus className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}
