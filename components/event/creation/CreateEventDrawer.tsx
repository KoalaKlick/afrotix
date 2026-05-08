"use client";

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { EventCreationClient } from "@/components/event/creation/EventCreationClient";
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
        variant="afro"
        className="w-full sm:max-w-2xl flex flex-col h-full"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-2xl font-black uppercase tracking-tight">
            Create New <span className="text-primary-600">Event</span>
          </SheetTitle>
          <SheetDescription className="font-medium text-muted-foreground italic">
            Set up your event details, dates, and settings in a few easy steps.
          </SheetDescription>
        </SheetHeader>

        <PanAfricanDivider className="h-1 shrink-0" />

        <SheetBody className="flex-1 overflow-y-auto py-4">
          <EventCreationClient organizationSlug={organizationSlug} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
