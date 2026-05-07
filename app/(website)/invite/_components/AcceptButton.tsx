"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptInviteByToken } from "@/lib/actions/organization";

interface AcceptButtonProps {
    token: string;
    organizationName: string;
}

export function AcceptButton({ token, organizationName }: Readonly<AcceptButtonProps>) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleAccept() {
        startTransition(async () => {
            const result = await acceptInviteByToken(token);
            if (result.success) {
                toast.success(`Welcome to ${organizationName}!`);
                router.push("/dashboard");
            } else {
                toast.error(result.error ?? "Failed to accept invitation");
            }
        });
    }

    return (
        <Button className="w-full" onClick={handleAccept} disabled={isPending}>
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <CheckCircle className="size-4" />
            )}
            Accept &amp; Join {organizationName}
        </Button>
    );
}
