'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecoveryKeyPanel } from '@/components/RecoveryKeyPanel';
import { toast } from 'sonner';
import { Eye, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    decryptRecoveryKeyFromStorage,
    decryptVault,
    encryptRecoveryKeyForStorage,
    encryptVaultWithMnemonic,
    generateRecoveryMnemonic,
    recoveryMnemonicDigest,
} from '@/lib/crypto';
import { getVaultAction } from '@/lib/actions';
import {
    getRecoveryRevealMaterialAction,
    setRecoveryMaterialAction,
} from '@/lib/recovery-actions';

type Mode = 'idle' | 'view' | 'rotate' | 'setup';

export function RecoverySettings({
    recoverySetUp,
    onRecoveryChanged,
}: {
    recoverySetUp: boolean;
    onRecoveryChanged: () => void;
}) {
    const { user } = useAuth();
    const [mode, setMode] = useState<Mode>('idle');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [shownMnemonic, setShownMnemonic] = useState<string | null>(null);
    const [shownIsNew, setShownIsNew] = useState(false);
    const [confirmedSaved, setConfirmedSaved] = useState(false);

    useEffect(() => {
        // Reset transient state when switching modes.
        setPassword('');
        setError(null);
        setShownMnemonic(null);
        setShownIsNew(false);
        setConfirmedSaved(false);
    }, [mode]);

    const handleViewRecoveryKey = async () => {
        if (pending) return;
        setError(null);
        setPending(true);
        try {
            const mat = await getRecoveryRevealMaterialAction();
            if (!mat.ok) {
                setError(mat.error);
                setPending(false);
                return;
            }
            const mnemonic = await decryptRecoveryKeyFromStorage(
                mat.encryptedRecoveryKey,
                password,
                mat.vaultSalt,
            );
            setShownMnemonic(mnemonic);
            setShownIsNew(false);
        } catch {
            setError('Wrong password.');
        } finally {
            setPending(false);
        }
    };

    /**
     * Rotation (existing recovery) and setup (no recovery yet) share the
     * exact same client flow:
     *   1. Recover the private RSA JWK by decrypting the password vault.
     *   2. Generate a new mnemonic, encrypt the JWK under it (recovery vault),
     *      encrypt the mnemonic under the password (storage blob).
     *   3. Send all four pieces to the server in one shot.
     */
    const handleRotateOrSetup = async () => {
        if (pending || !user?.displayName) return;
        setError(null);
        setPending(true);
        try {
            // 1. Recover the private key JWK via the password vault.
            const vaultData = await getVaultAction(user.displayName);
            if (!vaultData?.encryptedVault || !vaultData?.vaultSalt) {
                setError('Could not load your account vault.');
                setPending(false);
                return;
            }

            let privateKeyJwk;
            try {
                privateKeyJwk = await decryptVault(vaultData.encryptedVault, password, vaultData.vaultSalt);
            } catch {
                setError('Wrong password.');
                setPending(false);
                return;
            }

            // 2. Build the new recovery payload entirely client-side.
            const mnemonic = generateRecoveryMnemonic();
            const { vault: recoveryVault, salt: recoverySalt } = await encryptVaultWithMnemonic(privateKeyJwk, mnemonic);
            const encryptedRecoveryKey = await encryptRecoveryKeyForStorage(mnemonic, password, vaultData.vaultSalt);
            const recoveryDigest = await recoveryMnemonicDigest(mnemonic);

            // 3. Persist.
            const result = await setRecoveryMaterialAction({
                recoveryVault, recoverySalt, recoveryDigest, encryptedRecoveryKey,
            });
            if (!result.ok) {
                setError(result.error);
                setPending(false);
                return;
            }

            setShownMnemonic(mnemonic);
            setShownIsNew(true);
            toast.success(mode === 'setup' ? 'Account recovery set up.' : 'Recovery key rotated.');
            onRecoveryChanged();
        } catch {
            setError('Something went wrong.');
        } finally {
            setPending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Recovery</CardTitle>
                <CardDescription>
                    Your recovery key is the only way to regain access if you forget your password.
                    uunn cannot recover it for you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {mode === 'idle' && (
                    <div className="space-y-3">
                        {recoverySetUp ? (
                            <>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button variant="outline" onClick={() => setMode('view')}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Recovery Key
                                    </Button>
                                    <Button variant="outline" onClick={() => setMode('rotate')}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Rotate Recovery Key
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Rotating generates a new 24-word recovery key and invalidates the old one.
                                    Do this if you think your recovery key may have been seen by someone else.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm space-y-1">
                                    <p className="font-medium">Recovery is not set up.</p>
                                    <p className="text-muted-foreground">
                                        If you forget your password, you&apos;ll be locked out. Set up a recovery key now.
                                    </p>
                                </div>
                                <Button onClick={() => setMode('setup')}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Set Up Account Recovery
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {(mode === 'view' || mode === 'rotate' || mode === 'setup') && !shownMnemonic && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (mode === 'view') handleViewRecoveryKey();
                            else handleRotateOrSetup();
                        }}
                        className="space-y-4"
                    >
                        <p className="text-sm text-muted-foreground">
                            {mode === 'view' && 'Re-enter your password to reveal your recovery key.'}
                            {mode === 'rotate' && 'Re-enter your password to rotate your recovery key.'}
                            {mode === 'setup' && 'Re-enter your password to set up account recovery.'}
                        </p>
                        <div className="space-y-2">
                            <label htmlFor="recovery-pw" className="text-sm font-medium">Password</label>
                            <input
                                id="recovery-pw"
                                type="password"
                                required
                                autoFocus
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={pending || password.length === 0}>
                                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {mode === 'view' ? 'Reveal' : mode === 'rotate' ? 'Rotate' : 'Set Up'}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setMode('idle')} disabled={pending}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {shownMnemonic && (
                    <div className="space-y-4">
                        {shownIsNew && (
                            <p className="text-sm font-medium">
                                Your new recovery key:
                            </p>
                        )}
                        {!shownIsNew && (
                            <p className="text-sm font-medium">
                                Your current recovery key:
                            </p>
                        )}
                        <RecoveryKeyPanel
                            mnemonic={shownMnemonic}
                            confirmed={shownIsNew ? confirmedSaved : true}
                            onConfirmedChange={setConfirmedSaved}
                            username={user?.displayName || ''}
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={() => { setMode('idle'); }}
                                disabled={shownIsNew && !confirmedSaved}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
