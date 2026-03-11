"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User, Mail, AtSign, Calendar, CheckCircle } from "lucide-react";
import Image from "next/image";
import type { Profile } from "@/lib/generated/prisma";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardContentProps {
    readonly user: {
        id: string;
        email: string;
        fullName: string;
    };
    readonly profile: Profile | null;
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    const avatarUrl = profile?.avatarUrl;
    const displayName = profile?.fullName ?? user.fullName ?? "User";
    const username = profile?.username;
    const onboardingCompleted = profile?.onboardingCompleted ?? false;

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Card */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative">
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt={displayName}
                                        width={80}
                                        height={80}
                                        className="size-20 rounded-full object-cover border-2 border-primary/20"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="size-20 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                                        <User className="size-10 text-muted-foreground" />
                                    </div>
                                )}
                                {onboardingCompleted && (
                                    <CheckCircle className="absolute -bottom-1 -right-1 size-6 text-green-500 bg-card rounded-full" />
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-semibold truncate">{displayName}</h2>
                                {username && (
                                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                        <AtSign className="size-4" />
                                        <span className="truncate">{username}</span>
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Mail className="size-4" />
                                    <span className="truncate">{user.email}</span>
                                </p>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <div className="mt-6 pt-4 border-t">
                            <Button variant="outline" onClick={handleSignOut} className="w-full">
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Profile Details Card */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">Profile Details</h3>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">User ID</dt>
                                <dd className="font-mono text-xs truncate max-w-[200px]">{user.id}</dd>
                            </div>

                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Username</dt>
                                <dd>{username ?? <span className="text-muted-foreground/50">Not set</span>}</dd>
                            </div>

                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Full Name</dt>
                                <dd>{displayName}</dd>
                            </div>

                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Onboarding</dt>
                                <dd className="flex items-center gap-1">
                                    {onboardingCompleted ? (
                                        <>
                                            <CheckCircle className="size-4 text-green-500" />
                                            <span className="text-green-600">Complete</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-yellow-600">
                                                Step {profile?.onboardingStep ?? 0} of 3
                                            </span>
                                        </>
                                    )}
                                </dd>
                            </div>

                            {profile?.createdAt && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Joined</dt>
                                    <dd className="flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        {new Date(profile.createdAt).toLocaleDateString()}
                                    </dd>
                                </div>
                            )}

                            {profile?.referralCodeUsed && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Referral Code</dt>
                                    <dd className="font-mono text-xs">{profile.referralCodeUsed}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                    <p className="text-center">
                        <span className="font-semibold">{displayName}</span>, wo pre o! Me ne wo bɛyɛ adwuma pa ama AfroTix.
                        Yɛbɛtumi aboa wɔn ma AfroTix ayɛ kɛseɛ. Yɛda wo ase! 🎉
                    </p>
                </div>
            </div>
        </>
    );
}