'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { register, getVaultAction, upgradeVaultAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from "sonner";
import { useSearchParams, useRouter } from 'next/navigation';
import {
    generateUserKeyPair, exportKey, encryptVault, decryptVault,
    importPrivateKey, importPublicKey, getVaultVersion,
    generateRecoveryMnemonic, encryptVaultWithMnemonic, encryptRecoveryKeyForStorage,
    recoveryMnemonicDigest,
} from '@/lib/crypto';
import { STORAGE_KEYS } from '@/lib/constants';
import { setPrivateKey as cachePrivateKey, setPublicKey as cachePublicKey } from '@/lib/key-store';
import { suggestPassword } from '@/lib/password-suggest';
import { RecoveryKeyPanel } from '@/components/RecoveryKeyPanel';
import { Eye, EyeOff, Copy, Wand2 } from 'lucide-react';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

type Stage = 'form' | 'recovery';

interface RecoveryBundle {
    mnemonic: string;
    encryptedVault: string;
    vaultSalt: string;
    recoveryVault: string;
    recoverySalt: string;
    encryptedRecoveryKey: string;
    recoveryDigest: string;
    publicKey: string;
    privateKeyJwk: JsonWebKey;
}

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(searchParams.get('signup') === '1');
    const [publicKey, setPublicKey] = useState('');
    const [privateKeyJwk, setPrivateKeyJwk] = useState<JsonWebKey | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const [isPending, setIsPending] = useState(false);

    // Signup stage state
    const [stage, setStage] = useState<Stage>('form');
    const [bundle, setBundle] = useState<RecoveryBundle | null>(null);
    const [savedConfirmed, setSavedConfirmed] = useState(false);

    // Reset signup state when toggling modes
    useEffect(() => {
        setStage('form');
        setBundle(null);
        setSavedConfirmed(false);
        setErrorMessage(undefined);
    }, [isRegistering]);

    // Generate keys when entering register mode
    useEffect(() => {
        if (isRegistering) {
            (async () => {
                const keyPair = await generateUserKeyPair();
                const pubJwk = await exportKey(keyPair.publicKey);
                const privJwk = await exportKey(keyPair.privateKey);
                setPublicKey(JSON.stringify(pubJwk));
                setPrivateKeyJwk(privJwk);
                sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, JSON.stringify(pubJwk));
            })();
        }
    }, [isRegistering]);

    const handleSuggestPassword = () => {
        const pw = suggestPassword();
        setPassword(pw);
        setShowPassword(true);
    };

    const handleCopyPassword = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            toast.success('Password copied.');
        } catch {
            toast.error('Could not copy. Try selecting it manually.');
        }
    };

    const buildSignupBundle = async (): Promise<RecoveryBundle | null> => {
        if (!privateKeyJwk) {
            setErrorMessage('Still preparing keys — please try again in a moment.');
            return null;
        }
        try {
            const { vault, salt } = await encryptVault(privateKeyJwk, password);
            const mnemonic = generateRecoveryMnemonic();
            const { vault: recoveryVault, salt: recoverySalt } = await encryptVaultWithMnemonic(privateKeyJwk, mnemonic);
            const encryptedRecoveryKey = await encryptRecoveryKeyForStorage(mnemonic, password, salt);
            const digest = await recoveryMnemonicDigest(mnemonic);
            return {
                mnemonic,
                encryptedVault: vault,
                vaultSalt: salt,
                recoveryVault,
                recoverySalt,
                encryptedRecoveryKey,
                recoveryDigest: digest,
                publicKey,
                privateKeyJwk,
            };
        } catch {
            setErrorMessage('Could not prepare your account. Please try again.');
            return null;
        }
    };

    const handleSignupContinue = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(undefined);
        // Light client-side validation before doing heavy crypto.
        if (username.trim().length < 3) { setErrorMessage('Username must be at least 3 characters.'); return; }
        if (password.length < 12) { setErrorMessage('Password must be at least 12 characters.'); return; }
        setIsPending(true);
        const b = await buildSignupBundle();
        setIsPending(false);
        if (b) {
            setBundle(b);
            setStage('recovery');
        }
    };

    const handleFinalRegister = async () => {
        if (!bundle || !savedConfirmed) return;
        setIsPending(true);
        setErrorMessage(undefined);
        try {
            // Cache private key in module memory before the network round-trip.
            try {
                const importedPriv = await importPrivateKey(bundle.privateKeyJwk);
                cachePrivateKey(importedPriv);
            } catch {
                // Non-fatal — will retry via unlock flow on next page load.
            }

            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('publicKey', bundle.publicKey);
            formData.append('encryptedVault', bundle.encryptedVault);
            formData.append('vaultSalt', bundle.vaultSalt);
            formData.append('recoveryVault', bundle.recoveryVault);
            formData.append('recoverySalt', bundle.recoverySalt);
            formData.append('recoveryDigest', bundle.recoveryDigest);
            formData.append('encryptedRecoveryKey', bundle.encryptedRecoveryKey);

            const result = await register(undefined, formData);
            if (result) {
                setErrorMessage(result);
                setIsPending(false);
                return;
            }

            const signInResult = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });
            if (signInResult?.error) {
                setErrorMessage('Account created but sign-in failed. Try logging in.');
                setIsPending(false);
                return;
            }
            router.push('/dashboard');
        } catch {
            setErrorMessage('Something went wrong.');
            setIsPending(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const vaultData = await getVaultAction(username);
            if (vaultData && vaultData.encryptedVault && vaultData.vaultSalt) {
                try {
                    const decryptedJwk = await decryptVault(vaultData.encryptedVault, password, vaultData.vaultSalt);
                    const importedPriv = await importPrivateKey(decryptedJwk);
                    cachePrivateKey(importedPriv);

                    if (vaultData.publicKey) {
                        try {
                            const pubJwk = JSON.parse(vaultData.publicKey);
                            const importedPub = await importPublicKey(pubJwk);
                            cachePublicKey(importedPub, pubJwk);
                            sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, vaultData.publicKey);
                        } catch {
                            // Non-fatal
                        }
                    }

                    if (getVaultVersion(vaultData.encryptedVault) === 1) {
                        try {
                            const { vault: newVault, salt: newSalt } = await encryptVault(decryptedJwk, password);
                            await upgradeVaultAction(newVault, newSalt);
                        } catch {
                            // Non-fatal
                        }
                    }
                } catch {
                    // Wrong password or corrupt vault — server-side auth decides.
                }
            }
        } catch {
            // Vault fetch failed — server-side auth still runs.
        }

        setIsPending(true);
        setErrorMessage(undefined);
        try {
            const result = await signIn('credentials', {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                redirect: false,
            });
            if (result?.error) {
                setErrorMessage('Invalid credentials.');
                setIsPending(false);
            } else {
                router.push('/dashboard');
            }
        } catch {
            setErrorMessage('Something went wrong.');
            setIsPending(false);
        }
    };

    if (isRegistering && stage === 'recovery' && bundle) {
        return (
            <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Save Your Recovery Key</CardTitle>
                        <CardDescription className="text-center">
                            One last step before we create your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecoveryKeyPanel
                            mnemonic={bundle.mnemonic}
                            confirmed={savedConfirmed}
                            onConfirmedChange={setSavedConfirmed}
                            username={username}
                        />
                        <div className="flex h-8 items-end mt-2" aria-live="polite" aria-atomic="true">
                            {errorMessage && (
                                <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            className="w-full"
                            disabled={!savedConfirmed || isPending}
                            onClick={handleFinalRegister}
                        >
                            {isPending ? 'Creating account…' : 'Create Account'}
                        </Button>
                        <button
                            type="button"
                            className="text-sm text-muted-foreground hover:underline"
                            onClick={() => { setStage('form'); setBundle(null); setSavedConfirmed(false); }}
                            disabled={isPending}
                        >
                            Back
                        </button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isRegistering ? (
                            <>
                                Enter a username and password to join anonymously.
                                <br />
                                Avoid company devices and Wi-Fi when organizing.
                            </>
                        ) : (
                            'Enter your credentials to access your union.'
                        )}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={isRegistering ? handleSignupContinue : handleLoginSubmit}>
                    <input type="hidden" name="publicKey" value={publicKey} />
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="username">
                                Username (Pseudonym)
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Worker123"
                                required
                                minLength={3}
                                autoComplete={isRegistering ? 'username' : 'username'}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none" htmlFor="password">
                                    Password
                                </label>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                    {password && (
                                        <button
                                            type="button"
                                            onClick={handleCopyPassword}
                                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                            aria-label="Copy password"
                                        >
                                            <Copy className="h-3.5 w-3.5" /> Copy
                                        </button>
                                    )}
                                    {isRegistering && (
                                        <button
                                            type="button"
                                            onClick={handleSuggestPassword}
                                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                            aria-label="Suggest a strong password"
                                        >
                                            <Wand2 className="h-3.5 w-3.5" /> Suggest
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                minLength={isRegistering ? 12 : 1}
                                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {isRegistering && (
                                <p className="text-xs text-muted-foreground">
                                    At least 12 characters.
                                </p>
                            )}
                        </div>
                        <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                            {errorMessage && (
                                <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" disabled={isPending}>
                            {isPending ? 'Processing...' : isRegistering ? 'Continue' : 'Log In'}
                        </Button>
                        {!isRegistering && (
                            <div className="text-center text-sm">
                                <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                        <div className="text-center text-sm">
                            <button
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="text-primary hover:underline"
                            >
                                {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
