"use client";

import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";
import { Building2, Globe, Mail, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requestToJoinOrganization } from "@/lib/actions/organization";
import { getOrgImageUrl } from "@/lib/image-url-utils";

interface OrgProfileHeroProps {
    readonly organization: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logoUrl: string | null;
        bannerUrl: string | null;
        websiteUrl: string | null;
        contactEmail: string | null;
        _count: {
            members: number;
        };
    };
    readonly isUserAuthenticated: boolean;
    readonly hasPendingRequest: boolean;
}

export function OrgProfileHero({
    organization,
    isUserAuthenticated,
    hasPendingRequest
}: OrgProfileHeroProps) {
    const [isPending, startTransition] = useTransition();
    const bannerImageUrl = getOrgImageUrl(organization.bannerUrl);
    const logoImageUrl = getOrgImageUrl(organization.logoUrl);

    const handleJoinRequest = async () => {
        if (!isUserAuthenticated) {
            toast.error("Please log in to request joining this organization.");
            return;
        }

        startTransition(async () => {
            const result = await requestToJoinOrganization(organization.id);
            if (result.success) {
                toast.success("Request sent successfully! The organization admins will review it.");
            } else {
                toast.error(result.error ?? "Failed to send request.");
            }
        });
    };

    return (
        <div className="relative">
            {/* Banner */}
            <div className="relative h-48 md:h-64 w-full bg-muted overflow-hidden">
                {bannerImageUrl ? (
                    <Image
                        src={bannerImageUrl}
                        alt={organization.name}
                        fill
                        sizes="100vw"
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-r from-red-600 via-yellow-400 to-green-600 opacity-20" />
                )}
            </div>

            {/* Profile Info Overlay */}
            <div className="max-w-6xl mx-auto px-4 -mt-12 md:-mt-16 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
                    {/* Logo */}
                    <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-white p-2 shadow-xl border overflow-hidden">
                        {logoImageUrl ? (
                            <Image
                                src={logoImageUrl}
                                alt={organization.name}
                                fill
                                sizes="128px"
                                className="w-full h-full object-cover rounded-xl"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary rounded-xl">
                                <Building2 className="h-12 w-12" />
                            </div>
                        )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                            {organization.name}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {organization._count.members} Members
                            </div>
                            {organization.websiteUrl && (
                                <a
                                    href={organization.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                    <Globe className="h-4 w-4" />
                                    Website
                                </a>
                            )}
                            {organization.contactEmail && (
                                <div className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {organization.contactEmail}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pb-2">
                        <Button
                            size="lg"
                            className="bg-[#009A44] hover:bg-[#007a36] text-white font-bold uppercase tracking-widest px-8"
                            onClick={handleJoinRequest}
                            disabled={isPending || hasPendingRequest}
                        >
                            {hasPendingRequest ? "Request Pending" : "Request to Join"}
                            {!hasPendingRequest && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Description */}
                {organization.description && (
                    <Card className="mt-8 border-none shadow-sm bg-muted/30">
                        <CardContent className="p-6">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {organization.description}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
