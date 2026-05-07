"use client";

import Link from "next/link";
import type { InviteDetails } from "./_types";
import { InviteCardHeader } from "./_components/InviteCardHeader";
import { AcceptButton } from "./_components/AcceptButton";
import { InviteLoginForm } from "./_components/InviteLoginForm";
import { InviteRegisterForm } from "./_components/InviteRegisterForm";

interface InviteAcceptClientProps {
    token: string;
    invite: InviteDetails;
    /** The currently authenticated user's email, or null if not signed in */
    currentUserEmail: string | null;
    /** True if the invited email already has an AfroTix account */
    isExistingUser: boolean;
}

export function InviteAcceptClient({
    token,
    invite,
    currentUserEmail,
    isExistingUser,
}: Readonly<InviteAcceptClientProps>) {
    const emailMatches =
        currentUserEmail?.toLowerCase() === invite.email.toLowerCase();

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                    {/* Pan-African accent bar */}
                    <div className="flex h-1">
                        <div className="flex-1 bg-[#9b1c1c]" />
                        <div className="flex-1 bg-[#d97706]" />
                        <div className="flex-1 bg-[#16a34a]" />
                    </div>

                    <div className="p-8 space-y-6">
                        <InviteCardHeader invite={invite} />

                        <div className="h-px bg-border" />

                        {/* ── Already signed in ── */}
                        {currentUserEmail && (
                            <div className="space-y-3">
                                {emailMatches ? (
                                    <AcceptButton
                                        token={token}
                                        organizationName={invite.organization.name}
                                    />
                                ) : (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive space-y-2">
                                        <p className="font-medium">Wrong account</p>
                                        <p>
                                            This invitation was sent to{" "}
                                            <strong>{invite.email}</strong>. You&apos;re
                                            currently signed in as{" "}
                                            <strong>{currentUserEmail}</strong>.
                                        </p>
                                        <p>
                                            Please{" "}
                                            <Link
                                                href="/auth/login"
                                                className="underline font-medium"
                                            >
                                                sign in with the correct account
                                            </Link>
                                            .
                                        </p>
                                    </div>
                                )}
                                <p className="text-center text-xs text-muted-foreground">
                                    Signed in as {currentUserEmail}
                                </p>
                            </div>
                        )}

                        {/* ── Not signed in: existing AfroTix user → login only ── */}
                        {!currentUserEmail && isExistingUser && (
                            <InviteLoginForm
                                token={token}
                                email={invite.email}
                                organizationName={invite.organization.name}
                            />
                        )}

                        {/* ── Not signed in: new user → register only ── */}
                        {!currentUserEmail && !isExistingUser && (
                            <InviteRegisterForm
                                token={token}
                                email={invite.email}
                                organizationName={invite.organization.name}
                            />
                        )}
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    AfroTix &mdash; Empowering African Events
                </p>
            </div>
        </div>
    );
}
