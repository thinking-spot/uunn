'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinSecureInvite } from "@/services/unionService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function InviteClient({ inviteId, unionName }: { inviteId: string, unionName: string }) {
    const [status, setStatus] = useState<'idle' | 'validating' | 'joining' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [privateKeyStr, setPrivateKeyStr] = useState('');
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // 1. Extract Private Key from Hash
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.substring(1); // Remove '#'
            if (!hash) {
                setStatus('error');
                setErrorMsg("Invalid invite link (missing key). Ask the admin to resend the link.");
                return;
            }
            try {
                // Decode base64 just to verify it's valid? No, keep it strings.
                // Actually the hash is Base64(JSON(JWK)).
                // We'll pass the raw decoded string to `joinSecureInvite`.
                // Actually `joinSecureInvite` expects `visitPrivateKeyJwkStr`.
                // My logic in `createSecureInvite` was `btoa(JSON.stringify(jwk))`.
                // So here I should `atob(hash)`.
                const decoded = atob(hash);
                JSON.parse(decoded); // Verify JSON
                setPrivateKeyStr(decoded);
                setStatus('validating');
            } catch (e) {
                setStatus('error');
                setErrorMsg("Corrupted invite link.");
            }
        }
    }, []);

    const handleJoin = async () => {
        if (!user) {
            // Redirect to login with return URL
            // Encoded return URL must include the HASH because server ignores hash.
            // Client-side redirect works.
            const returnUrl = encodeURIComponent(`/invite/${inviteId}#${btoa(privateKeyStr)}`);
            router.push(`/login?redirectTo=${returnUrl}`); // Login page needs to handle redirectTo
            return;
        }

        setStatus('joining');
        try {
            await joinSecureInvite(inviteId, privateKeyStr);
            setStatus('success');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setErrorMsg(e.message || "Failed to join union");
        }
    };

    if (loading) return <div>Loading...</div>;

    if (status === 'error') {
        return (
            <Card className="w-full max-w-md border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <XCircle /> Invite Error
                    </CardTitle>
                    <CardDescription>{errorMsg}</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
                </CardFooter>
            </Card>
        );
    }

    if (status === 'success') {
        return (
            <Card className="w-full max-w-md border-green-500">
                <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                        <CheckCircle2 /> Joined Successfully!
                    </CardTitle>
                    <CardDescription>Redirecting you to {unionName}...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center">Join {unionName}</CardTitle>
                <CardDescription className="text-center">
                    You have been invited to join this secure union.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
                <div className="bg-muted p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4 text-2xl">
                    🏢
                </div>
                {user ? (
                    <p className="text-sm text-muted-foreground">
                        Joining as <span className="font-semibold text-foreground">{user.displayName}</span>
                    </p>
                ) : (
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        You must log in or create an account to join.
                    </p>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleJoin}
                    disabled={status === 'joining' || status === 'idle'} // Idle means key not parsed yet
                >
                    {status === 'joining' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {user ? 'Accept Invite & Join' : 'Log In to Accept'}
                </Button>
            </CardFooter>
        </Card>
    );
}
