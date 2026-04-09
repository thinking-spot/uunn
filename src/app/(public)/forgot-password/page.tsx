import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Reset Password",
    description: "uunn uses pseudonymous accounts without email. Password recovery is not available — create a new account to get started.",
};

export default function ForgotPasswordPage() {
    return (
        <div className="flex flex-1 items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        uunn uses pseudonymous accounts without email. Password reset is not available.
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        If you&apos;ve forgotten your password, you&apos;ll need to create a new account.
                    </p>
                </div>

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
