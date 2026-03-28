export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Future: Add public navbar / footer here
    return (
        <main className="h-full w-full overflow-y-auto bg-background">
            {children}
        </main>
    );
}
