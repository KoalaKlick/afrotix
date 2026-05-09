import { render } from "@react-email/render";
import transporter from "./mail";
import { TicketDeliveryEmail } from "../emails/ticket-delivery";
import { NominationConfirmationEmail } from "../emails/nomination-confirmation";
import { OrganizationInviteEmail } from "../emails/organization-invite";
import { EventCodeEmail } from "../emails/event-code";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import React from "react";

export async function sendEventCodeEmail({
  email,
  name,
  eventName,
  uniqueCode,
}: {
  email: string;
  name: string;
  eventName: string;
  uniqueCode: string;
}) {
  try {
    const emailHtml = await render(
      React.createElement(EventCodeEmail, {
        name,
        eventName,
        uniqueCode,
      })
    );

    const options = {
      from: `"${process.env.SMTP_FROM_NAME || "Afrotix"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Unique Code for ${eventName}`,
      html: emailHtml,
      text: `Hi ${name}, Your unique code for ${eventName} is: ${uniqueCode}. Use this code to vote or mark your attendance on the event page.`,
    };

    const info = await transporter.sendMail(options);
    console.log("Email sent: ", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendNominationConfirmationEmail({
  email,
  recipientName,
  nomineeName,
  categoryName,
  eventName,
  deletionCode,
}: {
  email: string;
  recipientName: string;
  nomineeName: string;
  categoryName: string;
  eventName: string;
  deletionCode?: string | null;
}) {
  try {
    const emailHtml = await render(
      React.createElement(NominationConfirmationEmail, {
        recipientName,
        nomineeName,
        categoryName,
        eventName,
        deletionCode,
      })
    );

    const from = process.env.SMTP_FROM_NAME || "Afrotix";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${from}" <${fromEmail}>`,
      to: email,
      subject: deletionCode
        ? `Your nomination for ${eventName} is live — exit key inside`
        : `Nomination received for ${eventName} — pending review`,
      html: emailHtml,
      text: deletionCode
        ? `Hi ${recipientName}, your nomination of ${nomineeName} for ${categoryName} at ${eventName} is confirmed. Your exit key is: ${deletionCode}. Keep it safe — you will need it if you want the nomination removed.`
        : `Hi ${recipientName}, your nomination of ${nomineeName} for ${categoryName} at ${eventName} has been received and is pending review by the organizers.`,
    });

    console.log("Nomination confirmation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending nomination confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendOrganizationInviteEmail({
  email,
  inviteeName,
  inviterName,
  organizationName,
  role,
  inviteUrl,
}: {
  email: string;
  inviteeName?: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}) {
  try {
    const emailHtml = await render(
      React.createElement(OrganizationInviteEmail, {
        inviteeName,
        inviterName,
        organizationName,
        role,
        inviteUrl,
      })
    );

    const from = process.env.SMTP_FROM_NAME || "AfroTix";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${from}" <${fromEmail}>`,
      to: email,
      subject: `You're invited to join ${organizationName} on AfroTix`,
      html: emailHtml,
      text: `${inviterName} has invited you to join ${organizationName} as a ${role} on AfroTix. Accept your invitation here: ${inviteUrl}`,
    });

    console.log("Organization invite email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending organization invite email:", error);
    return { success: false, error };
  }
}

export async function sendTicketDeliveryEmail(paymentId: string) {
  try {
    // 1. Fetch Payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.relatedType !== "ticket_order" && payment.relatedType !== "ticket") {
      return { success: false, error: "Invalid payment type for ticket delivery" };
    }

    const metadata = payment.metadata as Record<string, any>;

    // 2. Fetch Order
    const order = await prisma.ticketOrder.findFirst({
      where: { paymentId: payment.id },
      select: {
        id: true,
        eventId: true,
        orderNumber: true,
        buyerName: true,
        buyerPhone: true,
        subtotal: true,
      },
    });

    if (!order) {
      return { success: false, error: "Ticket order not found" };
    }

    // 3. Fetch Event
    const event = await prisma.event.findUnique({
      where: { id: order.eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        venueName: true,
        venueCity: true,
        organizationId: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // 4. Fetch Organization
    const organization = await prisma.organization.findUnique({
      where: { id: event.organizationId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        contactEmail: true,
      },
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    // 5. Fetch Tickets
    const tickets = await prisma.ticket.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        ticketCode: true,
        ticketTypeId: true,
      },
    });

    if (!tickets || tickets.length === 0) {
      return { success: false, error: "Tickets not found" };
    }

    // 6. Fetch Ticket Types for line items
    const ticketTypeIds = [...new Set(tickets.map((t) => t.ticketTypeId).filter(Boolean))];
    const ticketTypes = ticketTypeIds.length
      ? await prisma.ticketType.findMany({
          where: { id: { in: ticketTypeIds } },
          select: { id: true, name: true, price: true, currency: true },
        })
      : [];

    const ticketTypeMap = new Map(
      (ticketTypes ?? []).map((t) => [
        t.id,
        { name: t.name, price: Number(t.price) || 0, currency: t.currency || "GHS" },
      ])
    );

    const groupedItems = new Map<string, { name: string; quantity: number; unitPrice: number; currency: string }>();
    for (const ticket of tickets) {
      if (!ticket.ticketTypeId) continue;
      const typeInfo = ticketTypeMap.get(ticket.ticketTypeId);
      const key = ticket.ticketTypeId;
      const current = groupedItems.get(key);
      if (current) {
        current.quantity += 1;
      } else {
        groupedItems.set(key, {
          name: typeInfo?.name ?? "Ticket",
          quantity: 1,
          unitPrice: typeInfo?.price ?? 0,
          currency: typeInfo?.currency ?? "GHS",
        });
      }
    }

    // 7. Generate Ticket URLs
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_DOMAIN_URL || "").replace(/\/$/, "");
    const secret = process.env.TICKET_SIGNING_SECRET;

    if (!secret) {
      console.warn("TICKET_SIGNING_SECRET missing");
    }

    const ticketUrls = tickets.map((ticket) => {
      if (!appUrl || !secret) return "";
      const payload = `${ticket.id}:${ticket.ticketCode}`;
      const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const tokenData = { tId: ticket.id, tCode: ticket.ticketCode, sig };
      const token = Buffer.from(JSON.stringify(tokenData)).toString("base64url");
      return `${appUrl}/ticket/view?token=${token}`;
    }).filter(Boolean);

    const buyerEmail = payment.email || metadata.buyer_email;
    if (!buyerEmail) {
      return { success: false, error: "Buyer email missing" };
    }

    // 8. Render and Send
    const emailHtml = await render(
      React.createElement(TicketDeliveryEmail, {
        buyerName: order.buyerName || metadata.buyer_name || "Guest",
        organizationName: organization.name,
        organizationLogoUrl: organization.logoUrl,
        organizationContactEmail: organization.contactEmail,
        eventTitle: event.title,
        eventStartDate: event.startDate?.toString() || null,
        venueName: event.venueName,
        venueCity: event.venueCity,
        orderNumber: order.orderNumber,
        subtotal: Number(order.subtotal) || Number(payment.amount),
        currency: payment.currency || "GHS",
        ticketCount: tickets.length,
        ticketUrls,
        lineItems: Array.from(groupedItems.values()),
      })
    );

    const fromName = process.env.SMTP_FROM_NAME || "Afrotix";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: buyerEmail,
      subject: `Your Tickets for ${event.title}`,
      html: emailHtml,
    });

    // 9. Update metadata
    const deliveryMetadata = {
      ...metadata,
      delivery_email_sent_at: new Date().toISOString(),
      delivery_email_to: buyerEmail,
      delivery_email_result: info.messageId,
    };

    await prisma.payment.update({
      where: { id: payment.id },
      data: { metadata: deliveryMetadata },
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending ticket delivery email:", error);
    return { success: false, error: error.message || "Failed to send ticket email" };
  }
}
