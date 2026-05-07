"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Clock, Loader2, LogIn, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { acceptInviteByToken } from "@/lib/actions/organization";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { createClient } from "@/utils/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/auth";

interface InviteDetails {
    id: string;
    email: string;
    role: string;
    expiresAt: Date | null;
    organization: {
        id: string;
        name: string;
        logoUrl: string | null;
        slug: string;
    };
    inviter: {
        fullName: string | null;
        avatarUrl: string | null;
    } | null;
}

interface InviteAcceptClientProps {
    token: string;
    invite: InviteDetails;
    /** The currently authenticated user, or null if not logged in */
    currentUserEmail: string | null;
}

type AuthTab = "login" | "register";

export function InviteAcceptClient({
    token,
    invite,
    currentUserEmail,
}: InviteAcceptClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [tab, setTab] = useState<AuthTab>("login");

    // ── Auth form state ────────────────────────────────────────────────────
    const [email, setEmail] = useState(invite.email);
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [signUpSent, setSignUpSent] = useState(false);

    const logoUrl = getOrgImageUrl(invite.organization.logoUrl);
    const emailMatches =
        currentUserEmail?.toLowerCase() === invite.email.toLowerCase();

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

    // ── Accept (already logged in with matching email) ─────────────────────
    function handleAccept() {
        startTransition(async () => {
            const result = await acceptInviteByToken(token);
            if (result.success) {
                toast.success(`Welcome to ${invite.organization.name}!`);
                router.push("/dashboard");
            } else {
                toast.error(result.error ?? "Failed to accept invitation");
            }
        });
    }

    // ── Login then accept ──────────────────────────────────────────────────
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setAuthLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setAuthLoading(false);

        if (error) {
            toast.error(
                error.message === "Invalid login credentials"
                    ? "Incorrect email or password."
                    : error.message
            );
            return;
        }

        // Logged in — now accept
        startTransition(async () => {
            const result = await acceptInviteByToken(token);
            if (result.success) {
                toast.success(`Welcome to ${invite.organization.name}!`);
                router.push("/dashboard");
            } else {
                toast.error(result.error ?? "Failed to accept invitation");
            }
        });
    }

    // ── Register then verify ───────────────────────────────────────────────
    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setAuthLoading(true);
        const supabase = createClient();

        // After email verification the callback will redirect back to this page
        const nextUrl = `/invite?token=${token}`;
        const redirectTo = `${buildAuthCallbackUrl("signup")}&next=${encodeURIComponent(nextUrl)}`;

        const { error } = await supabase.auth.signUp({
            email: invite.email, // locked to the invited email
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: redirectTo,
            },
        });
        setAuthLoading(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setSignUpSent(true);
    }

    // ──────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Invite card */}
                <div className="rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                    {/* Pan-African accent */}
                    <div className="flex h-1">
                        <div className="flex-1 bg-[#9b1c1c]" />
                        <div className="flex-1 bg-[#d97706]" />
                        <div className="flex-1 bg-[#16a34a]" />
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Org info */}
                        <div className="flex items-center gap-4">
                            <Avatar className="size-14 rounded-xl border">
                                <AvatarImage src={logoUrl ?? undefined} alt={invite.organization.name} />
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

                        {/* Inviter + expiry */}
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

                        <div className="h-px bg-border" />

                        {/* ── Already logged in ── */}
                        {currentUserEmail && (
                            <div className="space-y-3">
                                {emailMatches ? (
                                    <Button
                                        className="w-full"
                                        onClick={handleAccept}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="size-4" />
                                        )}
                                        Accept &amp; Join {invite.organization.name}
                                    </Button>
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
                                            , or create a new one below.
                                        </p>
                                    </div>
                                )}
                                <p className="text-center text-xs text-muted-foreground">
                                    Signed in as {currentUserEmail}
                                </p>
                            </div>
                        )}

                        {/* ── Not logged in ── */}
                        {!currentUserEmail && !signUpSent && (
                            <div className="space-y-4">
                                {/* Tab switcher */}
                                <div className="flex rounded-lg border border-border overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setTab("login")}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                            tab === "login"
                                                ? "bg-foreground text-background"
                                                : "bg-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <LogIn className="inline size-3.5 mr-1.5" />
                                        Log in
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTab("register")}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                            tab === "register"
                                                ? "bg-foreground text-background"
                                                : "bg-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <UserPlus className="inline size-3.5 mr-1.5" />
                                        Create account
                                    </button>
                                </div>

                                {/* Login form */}
                                {tab === "login" && (
                                    <form onSubmit={handleLogin} className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Email
                                            </Label>
                                            <Input
                                                id="login-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Password
                                            </Label>
                                            <Input
                                                id="login-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={authLoading || isPending}
                                        >
                                            {authLoading || isPending ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <LogIn className="size-4" />
                                            )}
                                            Log in &amp; Accept
                                        </Button>
                                        <p className="text-center text-xs text-muted-foreground">
                                            <Link href="/auth/forgot-password" className="underline">
                                                Forgot password?
                                            </Link>
                                        </p>
                                    </form>
                                )}

                                {/* Register form */}
                                {tab === "register" && (
                                    <form onSubmit={handleRegister} className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Full Name
                                            </Label>
                                            <Input
                                                id="reg-name"
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                Email
                                            </Label>
                                            <Input
                                                id="reg-email"
                                                type="email"
                                                value={invite.email}
                                                readOnly
                                                className="bg-muted/50 cursor-not-allowed"
                                            />
                                            <p className="text-[11px] text-muted-foreground">
                                                Locked to the invited email address
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={authLoading}
                                        >
                                            {authLoading ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="size-4" />
                                            )}
                                            Create account &amp; accept
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* ── Email verification sent ── */}
                        {signUpSent && (
                            <div className="text-center space-y-3 py-2">
                                <div className="flex justify-center">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <CheckCircle className="size-8 text-green-600" />
                                    </div>
                                </div>
                                <h2 className="font-bold text-lg">Check your inbox</h2>
                                <p className="text-sm text-muted-foreground">
                                    We sent a verification link to{" "}
                                    <strong>{invite.email}</strong>. Click it to verify
                                    your account — you&apos;ll then be brought back here to
                                    complete joining {invite.organization.name}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    AfroTix &mdash; Empowering African Events
                </p>
            </div>
        </div>
    );
}
