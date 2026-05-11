'use client';

import { useState } from 'react';
import { Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Displays a freshly-generated 24-word BIP-39 recovery key. Forces the user
 * to acknowledge they've saved it before the parent can submit the form.
 *
 * The panel is intentionally noisy: the mnemonic is the only thing that
 * stands between a forgotten password and a totally locked-out account.
 */
export function RecoveryKeyPanel({
    mnemonic,
    confirmed,
    onConfirmedChange,
    username,
}: {
    mnemonic: string;
    confirmed: boolean;
    onConfirmedChange: (v: boolean) => void;
    username: string;
}) {
    const words = mnemonic.split(' ');
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(mnemonic);
            setCopied(true);
            toast.success('Recovery key copied to clipboard.');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Please write it down manually.');
        }
    };

    const handleDownload = () => {
        const content = [
            'uunn recovery key',
            '',
            `Username: ${username || '(set during signup)'}`,
            `Generated: ${new Date().toISOString()}`,
            '',
            'Keep this somewhere safe. Anyone with this 24-word key can',
            'unlock your account. uunn cannot recover it for you.',
            '',
            ...words.map((w, i) => `${(i + 1).toString().padStart(2, ' ')}. ${w}`),
        ].join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uunn-recovery-key-${(username || 'account').replace(/[^a-zA-Z0-9_-]/g, '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Recovery key downloaded.');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-700 dark:text-yellow-500" aria-hidden="true" />
                <div className="space-y-1">
                    <p className="font-medium">Save your recovery key now.</p>
                    <p className="text-muted-foreground">
                        These 24 words are the only way to recover your account if you forget
                        your password. uunn cannot recover it for you.
                    </p>
                </div>
            </div>

            <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md border bg-muted/40 p-3 text-sm" aria-label="Recovery key words">
                {words.map((w, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right tabular-nums">{i + 1}.</span>
                        <span className="font-mono font-medium">{w}</span>
                    </li>
                ))}
            </ol>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                >
                    <Download className="h-4 w-4" />
                    Download .txt
                </button>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
                <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 cursor-pointer"
                    checked={confirmed}
                    onChange={(e) => onConfirmedChange(e.target.checked)}
                />
                <span>
                    I&apos;ve saved my recovery key somewhere safe. I understand uunn cannot
                    recover my account without it.
                </span>
            </label>
        </div>
    );
}
