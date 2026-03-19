"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Clock, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/shared/image/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { resolveMembershipRequest } from "@/lib/actions/organization";
import { getAvatarUrl } from "@/lib/image-url-utils";

interface JoinRequest {
    id: string;
    organizationId: string;
    userId: string;
    message: string | null;
    createdAt: Date;
    user: {
        id: string;
        fullName: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

interface OrgJoinRequestsSettingsProps {
    readonly organizationId: string;
    readonly requests: JoinRequest[];
}

export function OrgJoinRequestsSettings({ organizationId, requests }: OrgJoinRequestsSettingsProps) {
    const [isPending, startTransition] = useTransition();

    const handleResolve = (requestId: string, targetUserId: string, action: "approve" | "reject") => {
        startTransition(async () => {
            const result = await resolveMembershipRequest(requestId, organizationId, targetUserId, action);
            if (result.success) {
                toast.success(action === "approve" ? "Member approved!" : "Request rejected.");
            } else {
                toast.error(result.error ?? "Failed to process request.");
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Join Requests
                    {requests.length > 0 && (
                        <StatusBadge variant="pending" className="ml-1" text={String(requests.length)} />
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No pending requests</p>
                        <p className="text-sm mt-1">New join requests will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                            >
                                <Avatar
                                    src={getAvatarUrl(req.user.avatarUrl) ?? ""}
                                    fullName={req.user.fullName ?? undefined}
                                    width={40}
                                    height={40}
                                    alt={req.user.fullName ?? "User avatar"}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                        {req.user.fullName ?? "Unknown User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{req.user.email}</p>
                                    {req.message && (
                                        <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded p-2">
                                            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{req.message}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        Requested {new Date(req.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => handleResolve(req.id, req.user.id, "approve")}
                                        disabled={isPending}
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive border-destructive/20 hover:bg-destructive/5"
                                        onClick={() => handleResolve(req.id, req.user.id, "reject")}
                                        disabled={isPending}
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
