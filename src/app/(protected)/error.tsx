"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectedError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Error captured by protected route error boundary
    }, [error]);

    return (
        <div className="flex h-[80vh] items-center justify-center p-6">
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle>Something went wrong!</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error.message || "An unexpected error occurred. Please try again."}
                    </p>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button onClick={reset} variant="outline">
                        Try again
                    </Button>
                    <Button variant="ghost" onClick={() => window.location.href = "/dashboard"}>
                        Go to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
