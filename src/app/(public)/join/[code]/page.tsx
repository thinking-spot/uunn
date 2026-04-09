"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUnionByInviteCodeAction, joinUnionAction } from "@/lib/union-actions";

type UnionInfo = {
    id: string;
    name: string;
    location: string;
    description: string;
    memberCount: number;
};

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [step, setStep] = useState(0); // 0 = loading
    const [isLoading, setIsLoading] = useState(false);
    const [unionInfo, setUnionInfo] = useState<UnionInfo | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        params.then(p => {
            setCode(p.code);
            loadUnion(p.code);
        });
    }, []);

    const loadUnion = async (inviteCode: string) => {
        const result = await getUnionByInviteCodeAction(inviteCode);
        if (result.error || !result.union) {
            setError(result.error || "Invalid invite code");
            setStep(-1);
            return;
        }
        setUnionInfo(result.union);
        setStep(1);
    };

    const handleJoin = async () => {
        if (!unionInfo) return;
        setIsLoading(true);
        const result = await joinUnionAction(unionInfo.id);
        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }
        if (result.alreadyMember) {
            setStep(4);
            setTimeout(() => router.push("/dashboard"), 1500);
            return;
        }
        setStep(4);
        setTimeout(() => router.push("/dashboard"), 1500);
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-4 bg-muted/30">
            <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">uunn</span>
                </div>

                {step === 0 && (
                    <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Looking up invite...</p>
                    </div>
                )}

                {step === -1 && (
                    <div className="text-center animate-in fade-in">
                        <h2 className="text-xl font-bold mb-2 text-destructive">Invalid Invite</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Link href="/login" className="text-primary hover:underline">Go to login</Link>
                    </div>
                )}

                {step === 1 && unionInfo && (
                    <div className="text-center animate-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold mb-2">You've been invited!</h2>
                        <p className="text-muted-foreground mb-6">
                            You are using invite code <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{code}</span> to join <strong>{unionInfo.name}</strong>.
                        </p>
                        <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg text-left text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Members</span>
                                    <span className="font-medium">{unionInfo.memberCount}</span>
                                </div>
                                {unionInfo.location && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium">{unionInfo.location}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center animate-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold mb-4">Secure Connection</h2>
                        <div className="space-y-4 text-left text-sm mb-6">
                            <div className="flex gap-3">
                                <Check className="h-5 w-5 text-green-500 shrink-0" />
                                <span>End-to-End Encryption enabled</span>
                            </div>
                            <div className="flex gap-3">
                                <Check className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Anonymous identity configured</span>
                            </div>
                            <div className="flex gap-3">
                                <Check className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Pseudonymous membership</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-6">
                            You must be logged in to join. If you don't have an account, you'll be asked to create one.
                        </p>
                        <button
                            onClick={handleJoin}
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Join Union"}
                        </button>
                        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center animate-in zoom-in">
                        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                        <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
                    </div>
                )}
            </div>

            <div className="mt-8 text-sm text-muted-foreground">
                <Link href="/" className="hover:underline">Back to Home</Link>
            </div>
        </div>
    );
}
