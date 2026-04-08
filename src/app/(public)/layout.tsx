import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1 w-full overflow-y-auto">
                {children}
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="uunn" width={20} height={20} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        &copy; 2026 uunn. Open source.
                    </p>
                </div>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="/privacy"
                    >
                        Privacy
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="/security"
                    >
                        Security
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="/how-it-works"
                    >
                        How It Works
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="/education"
                    >
                        Education
                    </Link>
                    <Link
                        className="text-xs hover:underline underline-offset-4"
                        href="/about"
                    >
                        About
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
