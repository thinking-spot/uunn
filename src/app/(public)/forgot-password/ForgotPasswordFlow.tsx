'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import {
    isValidRecoveryMnemonic, normalizeMnemonic,
    decryptVaultWithMnemonic, encryptVault, encryptRecoveryKeyForStorage,
    recoveryMnemonicDigest,
} from '@/lib/crypto';
import { getRecoveryVaultAction, resetPasswordAction } from '@/lib/recovery-actions';
import { suggestPassword } from '@/lib/password-suggest';

const WORD_COUNT = 24;
const EMPTY_WORDS = Array<string>(WORD_COUNT).fill('');

export function ForgotPasswordFlow() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [words, setWords] = useState<string[]>(EMPTY_WORDS);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const mnemonic = useMemo(() => words.map(w => w.trim().toLowerCase()).join(' ').trim(), [words]);
    const allWordsFilled = words.every(w => w.trim().length > 0);
    // Per-word membership in the BIP-39 English wordlist (used to highlight typos).
    const invalidWordIndices = useMemo(() => {
        const set = new Set<number>();
        words.forEach((w, i) => {
            const t = w.trim().toLowerCase();
            if (t.length > 0 && !englishWordlist.includes(t)) set.add(i);
        });
        return set;
    }, [words]);
    const mnemonicLooksValid = allWordsFilled && invalidWordIndices.size === 0 && isValidRecoveryMnemonic(mnemonic);
    const passwordOk = newPassword.length >= 12;
    const canSubmit = username.trim().length >= 3 && mnemonicLooksValid && passwordOk && !pending;

    const setWordAt = (i: number, value: string) => {
        setWords(prev => {
            const next = [...prev];
            next[i] = value;
            return next;
        });
    };

    // When the user pastes a full mnemonic into any single field, distribute
    // the words across all 24 cells instead of stuffing them into one input.
    const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        const tokens = text.trim().split(/\s+/).filter(Boolean);
        if (tokens.length <= 1) return; // not a mnemonic — let the field handle it normally
        e.preventDefault();
        setWords(prev => {
            const next = [...prev];
            for (let k = 0; k < tokens.length && i + k < WORD_COUNT; k++) {
                next[i + k] = tokens[k].toLowerCase();
            }
            return next;
        });
    };

    const clearWords = () => setWords(EMPTY_WORDS);

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
                            <div className="flex items-baseline justify-between">
                                <label className="text-sm font-medium">Recovery key (24 words)</label>
                                {words.some(w => w.length > 0) && (
                                    <button
                                        type="button"
                                        onClick={clearWords}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                            <datalist id="bip39-wordlist">
                                {englishWordlist.map(w => <option key={w} value={w} />)}
                            </datalist>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md border bg-muted/20 p-3">
                                {words.map((w, i) => {
                                    const isInvalid = invalidWordIndices.has(i);
                                    return (
                                        <div key={i} className="flex items-baseline gap-1.5">
                                            <span className="text-xs font-mono text-muted-foreground w-6 text-right tabular-nums shrink-0">
                                                {i + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                list="bip39-wordlist"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck={false}
                                                value={w}
                                                onChange={(e) => setWordAt(i, e.target.value.replace(/\s/g, ''))}
                                                onPaste={(e) => handlePaste(i, e)}
                                                aria-label={`Word ${i + 1}`}
                                                aria-invalid={isInvalid}
                                                className={`flex-1 min-w-0 rounded border bg-background px-2 py-1 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                    isInvalid ? 'border-destructive' : 'border-input'
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tip: paste your full key into the first box — the rest will fill in automatically.
                                {allWordsFilled && invalidWordIndices.size === 0 && !isValidRecoveryMnemonic(mnemonic) && (
                                    <span className="block text-destructive mt-1">
                                        All 24 words are valid BIP-39 words, but the key&apos;s checksum doesn&apos;t match — a word may be in the wrong order.
                                    </span>
                                )}
                                {invalidWordIndices.size > 0 && (
                                    <span className="block text-destructive mt-1">
                                        {invalidWordIndices.size === 1 ? '1 word is' : `${invalidWordIndices.size} words are`} not in the recovery wordlist.
                                    </span>
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
