"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { EventCreationClient } from "@/components/event/EventCreationClient";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";

interface CreateEventDrawerProps {
    readonly isOpen: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly organizationSlug?: string;
}

export function CreateEventDrawer({
    isOpen,
    onOpenChange,
    organizationSlug,
}: CreateEventDrawerProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-2xl overflow-y-auto p-0 border-l-4 border-l-primary-600"
            >
                <div className="relative h-full flex flex-col pt-0">
                    {/* Afro Geometric Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-secondary-500 rotate-45 transform translate-x-16 -translate-y-16" />
                    </div>

                    <SheetHeader className="p-6 pb-2 text-left bg-muted/30">
                        <SheetTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                             Create New <span className="text-primary-600">Event</span>
                        </SheetTitle>
                        <SheetDescription className="font-medium text-muted-foreground italic">
                            Set up your event details, dates, and settings in a few easy steps.
                        </SheetDescription>
                    </SheetHeader>

                    <PanAfricanDivider className="h-1.5" />

                    <div className="flex-1 p-6">
                        <EventCreationClient organizationSlug={organizationSlug} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
