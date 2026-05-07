"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth";

interface InviteRegisterFormProps {
    token: string;
    /** The invited email — locked so the account is tied to the invitation */
    email: string;
    organizationName: string;
}

export function InviteRegisterForm({
    token,
    email,
    organizationName,
}: Readonly<InviteRegisterFormProps>) {
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();
        const nextUrl = `/invite?token=${token}`;
        const redirectTo = `${buildAuthCallbackUrl("signup")}&next=${encodeURIComponent(nextUrl)}`;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: redirectTo,
            },
        });
        setLoading(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setSent(true);
    }

    if (sent) {
        return (
            <div className="text-center space-y-3 py-2">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle className="size-8 text-green-600" />
                    </div>
                </div>
                <h2 className="font-bold text-lg">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                    We sent a verification link to{" "}
                    <strong>{email}</strong>. Click it to verify your account
                    — you&apos;ll then be brought back here to complete joining{" "}
                    <strong>{organizationName}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Create a free AfroTix account to join{" "}
                <span className="font-medium text-foreground">
                    {organizationName}
                </span>
                .
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                    <Label
                        htmlFor="reg-name"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Full Name
                    </Label>
                    <Input
                        id="reg-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        required
                        autoFocus
                    />
                </div>
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
                    <p className="text-[11px] text-muted-foreground">
                        Locked to your invited email address
                    </p>
                </div>
                <div className="space-y-1.5">
                    <Label
                        htmlFor="reg-password"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                        Password
                    </Label>
                    <Input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        minLength={8}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <UserPlus className="size-4" />
                    )}
                    Create account &amp; accept
                </Button>
            </form>
        </div>
    );
}
