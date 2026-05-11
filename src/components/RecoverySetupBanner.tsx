'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, KeyRound, X } from 'lucide-react';
import { getUserProfileAction } from '@/lib/actions';

const DISMISS_KEY = 'uunn:recovery-banner-dismissed';

/**
 * Persistent (per-session) banner for accounts that pre-date the recovery-key
 * feature. Encourages them to set one up before they forget their password.
 *
 * Renders nothing for new accounts that already have recovery, and stays
 * dismissed (per sessionStorage) for the rest of the session if the user X's it.
 */
export function RecoverySetupBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const dismissed = typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1';
        if (dismissed) return;

        let cancelled = false;
        getUserProfileAction().then((r) => {
            if (cancelled) return;
            if (r.profile && r.profile.recovery_set_up === false) {
                setVisible(true);
            }
        }).catch(() => { /* silent */ });

        return () => { cancelled = true; };
    }, []);

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, '1');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="border-b bg-yellow-500/10">
            <div className="container px-4 py-2 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-700 dark:text-yellow-500" aria-hidden="true" />
                <p className="text-sm flex-1">
                    <span className="font-medium">Account recovery isn&apos;t set up.</span>{' '}
                    <span className="text-muted-foreground">If you forget your password, you&apos;ll be locked out.</span>
                </p>
                <Link
                    href="/settings"
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <KeyRound className="h-3.5 w-3.5" />
                    Set Up
                </Link>
                <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
