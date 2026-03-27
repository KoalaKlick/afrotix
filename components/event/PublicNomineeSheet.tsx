"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { Vote, Share2, Users, Hash, Mail } from "lucide-react";
import type { VotingOption } from "@/lib/types/voting";

// ─── Nominee Grid (client wrapper for click-to-open) ─────────────────────────

interface NomineeGridProps {
    readonly nominees: VotingOption[];
}

export function NomineeGrid({ nominees }: NomineeGridProps) {
    const [selectedNominee, setSelectedNominee] = useState<VotingOption | null>(null);

    function handleShare(e: React.MouseEvent, nominee: VotingOption) {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: nominee.optionText,
                text: `Vote for ${nominee.optionText}!`,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4 gap-8">
                {nominees.map((nominee) => {
                    const displayImageUrl = getEventImageUrl(nominee.imageUrl);
                    return (
                        <div
                            key={nominee.id}
                            onClick={() => setSelectedNominee(nominee)}
                            className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                            {/* Image */}
                            <div className="relative aspect-5/4 bg-linear-to-br from-[#009A44]/10 to-[#FFCD00]/10">
                                {displayImageUrl ? (
                                    <Image
                                        src={displayImageUrl}
                                        alt={nominee.optionText}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Users className="w-16 h-16 text-muted-foreground/20" />
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-base truncate">{nominee.optionText}</h3>
                                        {nominee.nomineeCode && (
                                            <p className="text-xs text-[#009A44] font-mono font-semibold mt-0.5">
                                                {nominee.nomineeCode}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => handleShare(e, nominee)}
                                            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                                            title="Share"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                        <div className="w-8 h-8 rounded-full bg-[#009A44]/10 flex items-center justify-center group-hover:bg-[#009A44] transition-colors">
                                            <Vote className="w-3.5 h-3.5 text-[#009A44] group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                                {/* Vote Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2 border-[#009A44]/20 text-[#009A44] hover:bg-[#009A44] hover:text-white transition-colors font-semibold uppercase tracking-wider text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: wire up actual voting
                                    }}
                                >
                                    <Vote className="w-3.5 h-3.5" />
                                    Vote
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Nominee Details Sheet */}
            <PublicNomineeSheet
                nominee={selectedNominee}
                open={!!selectedNominee}
                onOpenChange={(open) => {
                    if (!open) setSelectedNominee(null);
                }}
            />
        </>
    );
}

// ─── Nominee Detail Sheet ─────────────────────────────────────────────────────

interface PublicNomineeSheetProps {
    readonly nominee: VotingOption | null;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

function PublicNomineeSheet({ nominee, open, onOpenChange }: PublicNomineeSheetProps) {
    if (!nominee) return null;

    const displayImageUrl = getEventImageUrl(nominee.imageUrl);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col h-full p-0 sm:max-w-lg">
                {/* Sticky Header */}
                <SheetHeader className="px-6 py-4 border-b shrink-0">
                    <SheetTitle className="text-left">{nominee.optionText}</SheetTitle>
                </SheetHeader>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Image */}
                    {displayImageUrl && (
                        <div className="relative w-full aspect-square bg-muted">
                            <Image
                                src={displayImageUrl}
                                alt={nominee.optionText}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}

                    <div className="p-6 space-y-6">
                        {/* Name & Code */}
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">{nominee.optionText}</h2>
                            {nominee.nomineeCode && (
                                <p className="text-sm text-[#009A44] font-mono font-bold mt-1 flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" />
                                    {nominee.nomineeCode}
                                </p>
                            )}
                        </div>

                        {/* Contact */}
                        {nominee.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span>{nominee.email}</span>
                            </div>
                        )}

                        {/* Description / Pitch */}
                        {nominee.description && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Why Vote For Me
                                </h3>
                                <div
                                    className="prose prose-sm max-w-none text-foreground"
                                    dangerouslySetInnerHTML={{ __html: nominee.description }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t p-6 shrink-0 flex gap-3">
                    <Button
                        className="flex-1 gap-2 bg-[#009A44] hover:bg-[#009A44]/90 text-white font-bold uppercase tracking-widest"
                        size="lg"
                        onClick={() => {
                            // TODO: wire up actual voting
                        }}
                    >
                        <Vote className="w-4 h-4" />
                        Vote for {nominee.optionText}
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: nominee.optionText,
                                    text: `Vote for ${nominee.optionText}!`,
                                    url: window.location.href,
                                }).catch(() => { });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
