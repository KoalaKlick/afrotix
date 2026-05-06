import { Suspense } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { verifyTicketToken } from "@/lib/ticket-crypto";

import { createClient } from "@/utils/supabase/server";
import { TicketCard } from "@/components/shared/TicketPreview";
import { TicketDownloadButton } from "./TicketDownloadButton";
import { AlertCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TicketViewContent({ token }: { token: string }) {
  const verified = verifyTicketToken(token);

  if (!verified) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invalid Ticket Link</h1>
        <p className="text-muted-foreground max-w-md">
          This ticket link is invalid or has expired. Please check your email and ensure you are using the complete link.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch ticket and related data
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(`
      id,
      ticket_code,
      event:events (
        id,
        title,
        start_date,
        venue_name,
        venue_city,
        flier_image,
        banner_image,
        organization:organizations (
          name,
          logo_url,
          primary_color,
          secondary_color
        )
      ),
      ticket_type:ticket_types (
        name,
        primary_color,
        secondary_color,
        color
      )
    `)
    .eq("id", verified.ticketId)
    .single();

  if (ticketError || !ticket || !ticket.event || !ticket.ticket_type) {
    return notFound();
  }

  const event = (Array.isArray(ticket.event) ? ticket.event[0] : ticket.event) as any;
  const org = (Array.isArray(event?.organization) ? event.organization[0] : event?.organization) as any;

  const ticketType = (Array.isArray(ticket.ticket_type) ? ticket.ticket_type[0] : ticket.ticket_type) as any;

  const primaryColor = ticketType?.primary_color || ticketType?.color || org?.primary_color || "#009A44";
  const secondaryColor = ticketType?.secondary_color || org?.secondary_color || "#CE1126";

  const dateTime = event?.start_date
    ? new Date(event.start_date).toLocaleString("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date to be announced";

  const venue = [event?.venue_name, event?.venue_city].filter(Boolean).join(", ") || "Venue to be announced";


  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const verifyUrl = `${protocol}://${host}/ticket/verify?token=${token}`;


  return (
    <div className="min-h-screen bg-muted/20 mt-20 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Ticket</h1>
          <p className="text-muted-foreground">
            Please have this ready for scanning at the event. You can download it for offline access.
          </p>
        </div>

        <div className="flex justify-center" id="ticket-container">
          <TicketCard
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={org?.logo_url}
            flierImage={event?.flier_image}
            bannerImage={event?.banner_image}
            organizationName={org?.name || "Afrotix Event"}
            eventName={event?.title || "Afrotix Event"}
            ticketType={ticketType?.name || "General Admission"}
            dateTime={dateTime}
            venue={venue}
            ticketCode={ticket?.ticket_code}
            qrPayload={verifyUrl}
            className="w-full max-w-lg hover:-translate-y-1 transition-transform"
          />

        </div>

        {/* Hidden Export Containers for High-Res PNG Downloads */}
        <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none" aria-hidden="true">
          {/* Back Only (QR Code side) */}
          <div id="ticket-export-back" className="bg-transparent p-0">
            <TicketCard
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={org?.logo_url}
              flierImage={event?.flier_image}
              bannerImage={event?.banner_image}
              organizationName={org?.name || "Afrotix Event"}
              eventName={event?.title || "Afrotix Event"}
              ticketType={ticketType?.name || "General Admission"}
              dateTime={dateTime}
              venue={venue}
              ticketCode={ticket?.ticket_code}
              qrPayload={verifyUrl}
              exportMode={true}
              exportSide="back"
            />
          </div>

          {/* Both Sides */}
          <div id="ticket-export-both" className="bg-transparent p-0">
            <TicketCard
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={org?.logo_url}
              flierImage={event?.flier_image}
              bannerImage={event?.banner_image}
              organizationName={org?.name || "Afrotix Event"}
              eventName={event?.title || "Afrotix Event"}
              ticketType={ticketType?.name || "General Admission"}
              dateTime={dateTime}
              venue={venue}
              ticketCode={ticket?.ticket_code}
              qrPayload={verifyUrl}
              exportMode={true}
              exportSide="both"
            />
          </div>
        </div>


        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <TicketDownloadButton 
            label="Download Back"
            fileName={`Afrotix-Ticket-Back-${ticket?.ticket_code || "Download"}`} 
            elementId="ticket-export-back"
          />
          <TicketDownloadButton 
            label="Download Full Ticket"
            fileName={`Afrotix-Ticket-Full-${ticket?.ticket_code || "Download"}`} 
            elementId="ticket-export-both"
            variant="outline"
          />
        </div>

      </div>
    </div>
  );
}

export default async function TicketViewPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : undefined;

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Missing Ticket Link</h1>
        <p className="text-muted-foreground max-w-md">
          Please use the link provided in your confirmation email to view your ticket.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading ticket details...</div>}>
      <TicketViewContent token={token} />
    </Suspense>
  );
}
