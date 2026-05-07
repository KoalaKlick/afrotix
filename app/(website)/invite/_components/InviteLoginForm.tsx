"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { acceptInviteByToken } from "@/lib/actions/organization";

interface InviteLoginFormProps {
    token: string;
    /** The invited email — pre-filled and locked */
    email: string;
    organizationName: string;
}

export function InviteLoginForm({
    token,
    email,
    organizationName,
}: Readonly<InviteLoginFormProps>) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            toast.error(
                error.message === "Invalid login credentials"
                    ? "Incorrect password. Please try again."
                    : error.message
            );
            return;
        }

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
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Welcome back! Sign in to accept your invitation to{" "}
                <span className="font-medium text-foreground">
                    {organizationName}
                </span>
                .
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Email
                    </Label>
                    <Input
                        type="email"
                        value={email}
                        readOnly
                        className="bg-muted/50 cursor-not-allowed"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label
                        htmlFor="invite-password"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Password
                    </Label>
                    <Input
                        id="invite-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        autoFocus
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || isPending}
                >
                    {loading || isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <LogIn className="size-4" />
                    )}
                    Sign in &amp; Accept
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    <Link href="/auth/forgot-password" className="underline">
                        Forgot your password?
                    </Link>
                </p>
            </form>
        </div>
    );
}
