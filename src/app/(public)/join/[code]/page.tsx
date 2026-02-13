"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinPage({ params }: { params: { code: string } }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        setIsLoading(true);
        // Simulate join process
        setTimeout(() => {
            setIsLoading(false);
            setStep(4); // Success
            setTimeout(() => router.push("/dashboard"), 1500);
        }, 1500);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
            <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">uunn</span>
                </div>

                {step === 1 && (
                    <div className="text-center animate-in slide-in-from-right-4">
                        <h2 className="text-2xl font-bold mb-2">You've been invited!</h2>
                        <p className="text-muted-foreground mb-6">
                            You are using invite code <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{params.code}</span> to join <strong>Springfield General</strong>.
                        </p>
                        <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg text-left text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Members</span>
                                    <span className="font-medium">24</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Industry</span>
                                    <span className="font-medium">Healthcare</span>
                                </div>
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
                        <h2 className="text-xl font-bold mb-2">Choose your display name</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            This is how you will appear to other members in this union.
                        </p>
                        <input
                            className="w-full p-2 border rounded-md mb-2"
                            placeholder="e.g. Red Panda"
                            defaultValue="Worker One"
                        />
                        <p className="text-xs text-muted-foreground text-left mb-6">
                            * We recommend using a pseudonym.
                        </p>
                        <button
                            onClick={() => setStep(3)}
                            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90"
                        >
                            Next
                        </button>
                    </div>
                )}

                {step === 3 && (
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
                                <span>Zero-knowledge proof verification</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            <input type="checkbox" id="terms" className="rounded" />
                            <label htmlFor="terms" className="text-sm">I accept the terms and privacy policy</label>
                        </div>
                        <button
                            onClick={handleJoin}
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Join Union"}
                        </button>
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
