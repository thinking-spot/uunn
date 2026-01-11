import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyX } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center">
            <div className="flex flex-col items-center space-y-2">
                <CopyX className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-4xl font-bold tracking-tight">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
                <p className="text-muted-foreground max-w-sm">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>
            </div>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    );
}
