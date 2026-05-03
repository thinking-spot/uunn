'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { submitContactMessage } from '@/lib/contact-actions';

const fieldClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function ContactForm() {
    const [message, setMessage] = useState('');
    const [preferredContact, setPreferredContact] = useState('');
    const [website, setWebsite] = useState(''); // honeypot
    const [pending, setPending] = useState(false);
    const mountedAtRef = useRef<number>(Date.now());

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (pending) return;
        setPending(true);
        const result = await submitContactMessage({
            message,
            preferredContact,
            website,
            formMountedAt: mountedAtRef.current,
        });
        setPending(false);
        if (result.ok) {
            toast.success('Message sent. Thanks for reaching out.');
            setMessage('');
            setPreferredContact('');
        } else {
            toast.error(result.error);
        }
    }

    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto space-y-4 text-left">
            {/* Honeypot — hidden from real users, attractive to naive bots. */}
            <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-medium leading-none">
                    Your message
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={3}
                    maxLength={5000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={pending}
                    className={fieldClass}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="contact-preferred" className="text-sm font-medium leading-none">
                    Preferred contact <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                    id="contact-preferred"
                    name="preferredContact"
                    type="text"
                    maxLength={200}
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value)}
                    disabled={pending}
                    className={`${fieldClass} h-10`}
                />
            </div>
            <Button type="submit" disabled={pending || message.trim().length === 0} className="w-full sm:w-auto">
                {pending ? 'Sending…' : 'Send Message'}
            </Button>
        </form>
    );
}
