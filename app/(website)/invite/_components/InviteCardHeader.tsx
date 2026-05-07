import { Building2, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import type { InviteDetails } from "../_types";

interface Props {
    invite: InviteDetails;
}

export function InviteCardHeader({ invite }: Readonly<Props>) {
    const logoUrl = getOrgImageUrl(invite.organization.logoUrl);

    const orgInitials = invite.organization.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const roleLabel =
        invite.role.charAt(0).toUpperCase() + invite.role.slice(1);

    const expiresLabel = invite.expiresAt
        ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(invite.expiresAt)
          )
        : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="size-14 rounded-xl border">
                    <AvatarImage
                        src={logoUrl ?? undefined}
                        alt={invite.organization.name}
                    />
                    <AvatarFallback className="rounded-xl text-base font-bold">
                        {orgInitials}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                        You&apos;re invited to join
                    </p>
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                        {invite.organization.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            <Building2 className="size-3" />
                            {roleLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
                {invite.inviter?.fullName && (
                    <p>
                        Invited by{" "}
                        <span className="font-medium text-foreground">
                            {invite.inviter.fullName}
                        </span>
                    </p>
                )}
                <p>
                    Sent to{" "}
                    <span className="font-medium text-foreground">
                        {invite.email}
                    </span>
                </p>
                {expiresLabel && (
                    <p className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        Expires {expiresLabel}
                    </p>
                )}
            </div>
        </div>
    );
}
