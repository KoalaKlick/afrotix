import { Suspense } from "react";
import { notFound } from "next/navigation";
import { verifyTicketToken } from "@/lib/ticket-crypto";
import { createClient } from "@/utils/supabase/server";
import { getUserRoleInOrganization } from "@/lib/dal/organization";
import { AlertCircle, CheckCircle2, User, Mail, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TicketVerifyContent({ token }: { token: string }) {
  const verified = verifyTicketToken(token);

  if (!verified) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-card rounded-xl border shadow-sm max-w-md mx-auto mt-12">
        <AlertCircle className="size-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invalid Ticket</h1>
        <p className="text-muted-foreground">
          This ticket signature is invalid or forged. Do not grant entry.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch ticket and attendee data
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(`
      id,
      ticket_code,
      check_in_status,
      event_id,
      order:ticket_orders (
        buyer_name,
        buyer_phone,
        payment:payments (
          email
        )
      ),
      event:events (
        title,
        organization_id
      ),
      ticket_type:ticket_types (
        name
      )
    `)
    .eq("id", verified.ticketId)
    .single();

  if (ticketError || !ticket || !ticket.event || !ticket.order) {
    return notFound();
  }

  // Authorization: check if current user is an organizer for this event
  const eventData = (Array.isArray(ticket.event) ? ticket.event[0] : ticket.event) as any;
  const isAuthorized = user ? await getUserRoleInOrganization(user.id, eventData.organization_id) : false;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-card rounded-xl border shadow-sm max-w-md mx-auto mt-12">
        <AlertCircle className="size-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
        <p className="text-muted-foreground mb-4">
          You must be logged in as an event organizer to verify tickets.
        </p>
        <Button asChild>
          <a href="/login">Login to Verify</a>
        </Button>
      </div>
    );
  }

  const order = (Array.isArray(ticket.order) ? ticket.order[0] : ticket.order) as any;
  const payment = order?.payment;
  const paymentData = (Array.isArray(payment) ? payment[0] : payment) as any;
  const ticketType = (Array.isArray(ticket.ticket_type) ? ticket.ticket_type[0] : ticket.ticket_type) as any;

  const isCheckedIn = ticket.check_in_status === "checked_in";

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-card rounded-xl border shadow-sm">
      <div className="text-center mb-8">
        {isCheckedIn ? (
          <>
            <AlertCircle className="size-20 text-amber-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-amber-600 mb-2">Already Checked In</h1>
            <p className="text-muted-foreground">This ticket has already been used.</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-green-600 mb-2">Valid Ticket</h1>
            <p className="text-muted-foreground">Ready for entry check-in.</p>
          </>
        )}
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-muted/30 rounded-lg space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Attendee Details</h2>
          
          <div className="flex items-center gap-3">
            <User className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{order.buyer_name || "Guest"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email / Contact</p>
              <p className="text-sm text-muted-foreground">
                {paymentData?.email || order.buyer_phone || "No contact info"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Hash className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Ticket Tier & Code</p>
              <p className="text-sm text-muted-foreground font-mono">
                {ticketType?.name || "General"} | {ticket?.ticket_code}
              </p>
            </div>

          </div>
        </div>

        {!isCheckedIn && (
          <form action={async () => {
            "use server";
            const sb = await createClient();
            await sb.from("tickets").update({ check_in_status: "checked_in" }).eq("id", ticket.id);
            // Revalidate path if needed, or simply let the page refresh
          }}>
            <Button size="lg" className="w-full h-14 text-lg font-bold">
              Confirm Check-in
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default async function TicketVerifyPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : undefined;

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Missing Ticket Signature</h1>
        <p className="text-muted-foreground max-w-md">
          Please scan a valid ticket QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center mt-20 text-muted-foreground">
          <Loader2 className="size-8 animate-spin mb-4" />
          <p>Verifying signature...</p>
        </div>
      }>
        <TicketVerifyContent token={token} />
      </Suspense>
    </div>
  );
}
