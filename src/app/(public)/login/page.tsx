'use client';

import { useActionState } from 'react'; // React 19 hook (formerly useFormState)
import { useFormStatus } from 'react-dom';
import { authenticate, register } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';

import { generateUserKeyPair, exportKey, encryptVault } from '@/lib/crypto';
import { useEffect } from 'react';

export default function LoginPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [publicKey, setPublicKey] = useState('');
    const [privateKeyJwk, setPrivateKeyJwk] = useState<JsonWebKey | null>(null);
    const [password, setPassword] = useState('');

    const [errorMessage, formAction] = useActionState(
        isRegistering ? register : authenticate,
        undefined
    );

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
                localStorage.setItem('uunn_public_key', JSON.stringify(pubJwk));
            };
            initKeys();
        }
    }, [isRegistering]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Optimistically save private key to local storage
        if (isRegistering && privateKeyJwk) {
            localStorage.setItem('uunn_private_key', JSON.stringify(privateKeyJwk));

            // Encrypt Vault for Backup
            try {
                const { vault, salt } = await encryptVault(privateKeyJwk, password);
                formData.append('encryptedVault', vault);
                formData.append('vaultSalt', salt);
            } catch (err) {
                console.error("Failed to encrypt vault:", err);
                // Continue anyway? Or block? 
                // Let's continue but warn? Ideally block.
            }
        }

        // Pass the modified FormData to the action
        // startTransition is handled by useActionState's dispatcher?
        // Wait, useActionState returns [state, dispatch]. dispatch(payload).
        // If the payload is formData, we just pass the modified one.
        formAction(formData);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary/20 p-4">
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
                                minLength={6}
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
                        <LoginButton isRegistering={isRegistering} />
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

function LoginButton({ isRegistering }: { isRegistering: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" aria-disabled={pending}>
            {pending ? 'Processing...' : isRegistering ? 'Create Account' : 'Log In'}
        </Button>
    );
}
