"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Clock, Loader2, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/shared/image/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { resolveMembershipRequest, setAllowJoinRequests } from "@/lib/actions/organization";
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
    readonly allowJoinRequests: boolean;
    readonly requests: JoinRequest[];
}

export function OrgJoinRequestsSettings({ organizationId, allowJoinRequests, requests }: OrgJoinRequestsSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [isTogglingJoin, startToggleTransition] = useTransition();
    const [joinEnabled, setJoinEnabled] = useState(allowJoinRequests);

    const handleToggleJoinRequests = (checked: boolean) => {
        setJoinEnabled(checked);
        startToggleTransition(async () => {
            const result = await setAllowJoinRequests(organizationId, checked);
            if (result.success) {
                toast.success(checked ? "Join requests enabled." : "Join requests disabled.");
            } else {
                setJoinEnabled(!checked); // revert on failure
                toast.error(result.error ?? "Failed to update setting.");
            }
        });
    };

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
        <div className="space-y-4">
            {/* Toggle card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Join Request Setting
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Control whether other organizers can see a "Request to Join" button on your organization's public page. If enabled, anyone can request to join and you'll be able to review and approve/deny requests below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="allow-join-toggle" className="text-sm font-medium">
                                Allow join requests
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {joinEnabled
                                    ? "Anyone can request to join. You review and approve requests."
                                    : "The join button is hidden on your public page."}
                            </p>
                        </div>
                        <Switch
                            id="allow-join-toggle"
                            checked={joinEnabled}
                            onCheckedChange={handleToggleJoinRequests}
                            disabled={isTogglingJoin}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Requests list card */}
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
        </div>
    );
}
