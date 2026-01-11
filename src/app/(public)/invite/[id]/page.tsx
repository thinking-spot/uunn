import { getInviteAction } from "@/lib/union-actions";
import InviteClient from "@/components/InviteClient";
import { notFound } from "next/navigation";

// Server Component
export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const inviteData = await getInviteAction(id);

    if (inviteData.error) {
        return notFound();
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary/20 p-4">
            <InviteClient
                inviteId={id}
                unionName={inviteData.unionName}
            />
        </div>
    );
}
