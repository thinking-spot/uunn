import type { Metadata } from "next";
import { getInviteAction } from "@/lib/union-actions";
import InviteClient from "@/components/InviteClient";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: "Secure Invite",
    description: "You've been invited to join a union on uunn. Accept your invitation to start organizing securely.",
    robots: { index: false },
};

// Server Component
export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const inviteData = await getInviteAction(id);

    if (inviteData.error) {
        return notFound();
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-secondary/20 p-4">
            <InviteClient
                inviteId={id}
                unionName={inviteData.unionName}
            />
        </div>
    );
}
