"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function TicketDownloadButton() {
  return (
    <Button size="lg" className="rounded-full px-8" onClick={() => window.print()}>
      <Download className="mr-2 size-5" />
      Save Ticket
    </Button>
  );
}
