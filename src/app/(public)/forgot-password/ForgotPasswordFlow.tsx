'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    isValidRecoveryMnemonic, normalizeMnemonic,
    decryptVaultWithMnemonic, encryptVault, encryptRecoveryKeyForStorage,
    recoveryMnemonicDigest,
} from '@/lib/crypto';
import { getRecoveryVaultAction, resetPasswordAction } from '@/lib/recovery-actions';
import { suggestPassword } from '@/lib/password-suggest';

export function ForgotPasswordFlow() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [mnemonic, setMnemonic] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const mnemonicLooksValid = mnemonic.trim().length > 0 && isValidRecoveryMnemonic(mnemonic);
    const passwordOk = newPassword.length >= 12;
    const canSubmit = username.trim().length >= 3 && mnemonicLooksValid && passwordOk && !pending;

    const handleSuggest = () => { setNewPassword(suggestPassword()); setShowPassword(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setPending(true);
        try {
            const normalized = normalizeMnemonic(mnemonic);

            // 1. Fetch the recovery vault (always returns something — real or
            //    decoy — so the server can't disclose username existence).
            const vaultData = await getRecoveryVaultAction(username.trim());
            if (!vaultData?.recoveryVault || !vaultData?.recoverySalt) {
                setError('Could not load recovery material for that username.');
                setPending(false);
                return;
            }

            // 2. Try to decrypt locally. If the username was unknown or the
            //    mnemonic is wrong, this throws — same error path either way.
            let privateKeyJwk;
            try {
                privateKeyJwk = await decryptVaultWithMnemonic(vaultData.recoveryVault, normalized, vaultData.recoverySalt);
            } catch {
                setError('Username and recovery key do not match.');
                setPending(false);
                return;
            }

            // 3. Re-encrypt the recovered private key under the new password,
            //    and re-encrypt the mnemonic for storage under the new password.
            const { vault: newEncryptedVault, salt: newVaultSalt } = await encryptVault(privateKeyJwk, newPassword);
            const newEncryptedRecoveryKey = await encryptRecoveryKeyForStorage(normalized, newPassword, newVaultSalt);
            const digest = await recoveryMnemonicDigest(normalized);

            // 4. Send to the server. Server bcrypt-verifies the digest against
            //    the stored recovery_hash, then atomically swaps in the new
            //    password hash and password-side vault.
            const result = await resetPasswordAction({
                username: username.trim(),
                recoveryDigest: digest,
                newPassword,
                newEncryptedVault,
                newVaultSalt,
                newEncryptedRecoveryKey,
            });

            if (!result.ok) {
                setError(result.error);
                setPending(false);
                return;
            }

            toast.success('Password reset. You can now log in.');
            setDone(true);
            setTimeout(() => router.push('/login'), 1500);
        } catch {
            setError('Something went wrong. Please try again.');
            setPending(false);
        }
    };

    if (done) {
        return (
            <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Password reset</CardTitle>
                        <CardDescription className="text-center">
                            Redirecting you to login…
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        Use your 24-word recovery key to set a new password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                required
                                minLength={3}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="mnemonic">Recovery key (24 words)</label>
                            <textarea
                                id="mnemonic"
                                required
                                rows={4}
                                value={mnemonic}
                                onChange={(e) => setMnemonic(e.target.value)}
                                placeholder="word1 word2 word3 ... word24"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">
                                Case and spacing don&apos;t matter. {mnemonic.trim().length > 0 && !mnemonicLooksValid && (
                                    <span className="text-destructive">Not a valid 24-word recovery key.</span>
                                )}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium" htmlFor="new-password">New password</label>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSuggest}
                                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <Wand2 className="h-3.5 w-3.5" /> Suggest
                                    </button>
                                </div>
                            </div>
                            <input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={12}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">At least 12 characters.</p>
                        </div>

                        <div className="flex h-8 items-end" aria-live="polite" aria-atomic="true">
                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button type="submit" className="w-full" disabled={!canSubmit}>
                            {pending ? 'Resetting…' : 'Reset Password'}
                        </Button>
                        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:underline">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign in
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
