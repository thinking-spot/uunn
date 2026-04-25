"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import {
    decryptVault,
    encryptVault,
    importPrivateKey,
    importPublicKey,
    getVaultVersion,
} from "@/lib/crypto";
import { getVaultAction, upgradeVaultAction } from "@/lib/actions";
import { hasPrivateKey, setPrivateKey, setPublicKey } from "@/lib/key-store";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Wraps protected content. When the NextAuth session is active but no
 * private key is loaded in memory (post-refresh / new tab), prompts the
 * user for their password to derive the key from the server-stored vault.
 *
 * The key never persists to disk-backed storage — closing the tab loses it
 * and a fresh unlock is required next time. This is the trade we make for
 * H2 (key not extractable from sessionStorage).
 */
export function UnlockGate({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [unlocked, setUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Re-check on session change. hasPrivateKey() is the source of truth.
    useEffect(() => {
        setUnlocked(hasPrivateKey());
    }, [session?.user?.id, status]);

    // No session → defer to ProtectedRoute (which redirects to /login).
    // Loading → render children so layout doesn't flash.
    if (status !== "authenticated") return <>{children}</>;
    if (unlocked) return <>{children}</>;

    const username = session?.user?.name as string | undefined;

    const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!username) {
            setError("Session has no username — please log out and log in again.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const vaultData = await getVaultAction(username);
            if (!vaultData || !vaultData.encryptedVault || !vaultData.vaultSalt) {
                setError("Could not load your vault. Please try again.");
                return;
            }

            let decryptedJwk;
            try {
                decryptedJwk = await decryptVault(
                    vaultData.encryptedVault,
                    password,
                    vaultData.vaultSalt,
                );
            } catch {
                setError("Wrong password.");
                return;
            }

            const importedPriv = await importPrivateKey(decryptedJwk);
            setPrivateKey(importedPriv);

            if (vaultData.publicKey) {
                try {
                    const pubJwk = JSON.parse(vaultData.publicKey);
                    const importedPub = await importPublicKey(pubJwk);
                    setPublicKey(importedPub, pubJwk);
                    sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, vaultData.publicKey);
                } catch {
                    // Non-fatal.
                }
            }

            // Lazy upgrade legacy v1 vaults.
            if (getVaultVersion(vaultData.encryptedVault) === 1) {
                try {
                    const { vault: newVault, salt: newSalt } = await encryptVault(decryptedJwk, password);
                    await upgradeVaultAction(newVault, newSalt);
                } catch {
                    // Non-fatal.
                }
            }

            setUnlocked(true);
            setPassword("");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Lock className="h-5 w-5" />
                        Unlock your account
                    </CardTitle>
                    <CardDescription>
                        Enter your password to decrypt messages and documents on this device. Your password is never sent to the server — it stays in your browser to derive your encryption keys.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUnlock}>
                    <CardContent className="space-y-3">
                        {username && (
                            <div className="text-sm text-muted-foreground">
                                Signed in as <span className="font-medium text-foreground">{username}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="unlock-password">
                                Password
                            </label>
                            <input
                                id="unlock-password"
                                type="password"
                                autoFocus
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <div className="h-5 text-sm text-destructive" aria-live="polite">
                            {error}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={submitting || !password}>
                            {submitting ? "Unlocking…" : "Unlock"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
