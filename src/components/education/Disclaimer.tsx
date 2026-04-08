import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
    return (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
                This content is for educational purposes only and does not
                constitute legal advice. Consult a qualified labor attorney for
                advice specific to your situation.
            </p>
        </div>
    );
}
