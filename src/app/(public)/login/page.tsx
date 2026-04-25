'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { register, getVaultAction, upgradeVaultAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from "sonner";
import { useSearchParams, useRouter } from 'next/navigation';
import { generateUserKeyPair, exportKey, encryptVault, decryptVault, importPrivateKey, importPublicKey, getVaultVersion } from '@/lib/crypto';
import { STORAGE_KEYS } from '@/lib/constants';
import { setPrivateKey as cachePrivateKey, setPublicKey as cachePublicKey } from '@/lib/key-store';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(searchParams.get('signup') === '1');
    const [publicKey, setPublicKey] = useState('');
    const [privateKeyJwk, setPrivateKeyJwk] = useState<JsonWebKey | null>(null);
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const [isPending, setIsPending] = useState(false);

    // Generate keys when switching to register mode
    useEffect(() => {
        if (isRegistering) {
            const initKeys = async () => {
                const keyPair = await generateUserKeyPair();
                const pubJwk = await exportKey(keyPair.publicKey);
                const privJwk = await exportKey(keyPair.privateKey);

                setPublicKey(JSON.stringify(pubJwk));
                setPrivateKeyJwk(privJwk);
                // Store Public Key too for self-encryption operations
                sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, JSON.stringify(pubJwk));
            };
            initKeys();
        }
    }, [isRegistering]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;

        if (isRegistering && privateKeyJwk) {
            // Cache the freshly-generated private key in module memory.
            // It is NOT written to sessionStorage — see key-store.ts and H2.
            try {
                const importedPriv = await importPrivateKey(privateKeyJwk);
                cachePrivateKey(importedPriv);
            } catch {
                // Non-fatal: import will be retried via unlock flow on next page load.
            }

            // Encrypt vault for backup (v2 envelope, PBKDF2 600k iterations).
            try {
                const { vault, salt } = await encryptVault(privateKeyJwk, password);
                formData.append('encryptedVault', vault);
                formData.append('vaultSalt', salt);
            } catch {
                // Vault encryption failed silently
            }
        } else if (!isRegistering) {
            // Login: derive private key from server-stored vault using the password.
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
                                // Public key is not sensitive — keeping it in sessionStorage
                                // lets other tabs/components fetch it without a server roundtrip.
                                sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, vaultData.publicKey);
                            } catch {
                                // Public-key import failure is non-fatal here; createUnion
                                // and similar flows can re-fetch it on demand.
                            }
                        }

                        // Lazy vault upgrade: re-encrypt as v2 if currently v1.
                        if (getVaultVersion(vaultData.encryptedVault) === 1) {
                            try {
                                const { vault: newVault, salt: newSalt } = await encryptVault(decryptedJwk, password);
                                await upgradeVaultAction(newVault, newSalt);
                            } catch {
                                // Upgrade failure shouldn't block login.
                            }
                        }
                    } catch {
                        // Vault decryption failed — could be wrong password or corrupted
                        // vault. Don't block login: server-side auth decides. User will
                        // hit the unlock prompt and can retry.
                    }
                }
            } catch {
                // Vault fetch failed silently
            }
        }

        setIsPending(true);
        setErrorMessage(undefined);
        try {
            if (isRegistering) {
                // Registration uses server action
                const result = await register(undefined, formData);
                if (result) {
                    setErrorMessage(result);
                    setIsPending(false);
                    return;
                }
            }

            // Login (or auto-login after registration) uses client-side signIn
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

    return (
        <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isRegistering
                            ? 'Enter a username and password to join anonymously.'
                            : 'Enter your credentials to access your union.'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="publicKey" value={publicKey} />
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                                Username (Pseudonym)
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Worker123"
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                id="password"
                                type="password"
                                name="password"
                                required
                                minLength={isRegistering ? 12 : 1}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                            {errorMessage && (
                                <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <LoginButton isRegistering={isRegistering} pending={isPending} />
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

function LoginButton({ isRegistering, pending }: { isRegistering: boolean; pending: boolean }) {
    return (
        <Button className="w-full" disabled={pending}>
            {pending ? 'Processing...' : isRegistering ? 'Create Account' : 'Log In'}
        </Button>
    );
}
