"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            await resetPassword(email);
            setMessage("Check your email for password reset instructions.");
        } catch (err: any) {
            setError("Failed to send reset email. Please check the email address.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your email to receive reset instructions
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600">
                            {message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isLoading ? "Sending Link..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <Link href="/login" className="flex items-center justify-center gap-2 font-semibold text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
