import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getInvitationByToken } from "@/lib/dal/organization";
import { InviteAcceptClient } from "./InviteAcceptClient";

interface InvitePageProps {
    searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({
    searchParams,
}: InvitePageProps): Promise<Metadata> {
    const { token } = await searchParams;
    if (!token) return { title: "Invalid Invitation" };

    const invite = await getInvitationByToken(token);
    if (!invite) return { title: "Invitation Not Found" };

    return {
        title: `Join ${invite.organization.name} on AfroTix`,
        description: `You've been invited to join ${invite.organization.name} as a ${invite.role}.`,
    };
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
    const { token } = await searchParams;

    if (!token) {
        notFound();
    }

    const invite = await getInvitationByToken(token);

    if (!invite) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-sm space-y-3">
                    <div className="text-5xl">🔗</div>
                    <h1 className="text-2xl font-bold">Invitation not found</h1>
                    <p className="text-muted-foreground text-sm">
                        This invitation link is invalid or has already been used.
                    </p>
                </div>
            </div>
        );
    }

    if (invite.status !== "pending") {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-sm space-y-3">
                    <div className="text-5xl">
                        {invite.status === "accepted" ? "✅" : "⏰"}
                    </div>
                    <h1 className="text-2xl font-bold capitalize">
                        Invitation {invite.status}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {invite.status === "accepted"
                            ? "This invitation has already been accepted."
                            : "This invitation has expired or been declined."}
                    </p>
                </div>
            </div>
        );
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-sm space-y-3">
                    <div className="text-5xl">⏰</div>
                    <h1 className="text-2xl font-bold">Invitation expired</h1>
                    <p className="text-muted-foreground text-sm">
                        This invitation link has expired. Please ask{" "}
                        {invite.inviter?.fullName ?? "the organizer"} to send a new one.
                    </p>
                </div>
            </div>
        );
    }

    // Check if the user is currently authenticated
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const currentUserEmail = user?.email ?? null;

    return (
        <InviteAcceptClient
            token={token}
            invite={{
                id: invite.id,
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt,
                organization: invite.organization,
                inviter: invite.inviter
                    ? {
                          fullName: invite.inviter.fullName,
                          avatarUrl: invite.inviter.avatarUrl,
                      }
                    : null,
            }}
            currentUserEmail={currentUserEmail}
        />
    );
}
