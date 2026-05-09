import { NextRequest, NextResponse } from "next/server";
import transporter from "@/lib/mail";
import { render } from "@react-email/render";
import React from "react";
import { sendTicketDeliveryEmail } from "@/lib/email-actions";
import { NominationConfirmationEmail } from "@/emails/nomination-confirmation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    // 1. Fetch Payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // 2. Ticket purchase emails
    if (payment.relatedType === "ticket_order" || payment.relatedType === "ticket") {
      const result = await sendTicketDeliveryEmail(paymentId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, channel: "email", messageId: result.messageId });
    }

    // 2b. Paid nomination confirmation email
    if (payment.relatedType === "nomination") {
      if (!payment.relatedId) {
        console.error("send-delivery: nomination payment has no relatedId yet", paymentId);
        return NextResponse.json({ success: true, channel: "none", skipped: "no_relatedId" });
      }

      const option = await prisma.votingOption.findUnique({
        where: { id: payment.relatedId },
        select: {
          id: true,
          optionText: true,
          email: true,
          nominatedByEmail: true,
          nominatedByName: true,
          deletionCode: true,
          categoryId: true,
          eventId: true,
        },
      });

      if (!option) {
        console.error("send-delivery: voting_option not found for nomination payment", { paymentId, relatedId: payment.relatedId });
        return NextResponse.json({ success: true, channel: "none", skipped: "option_not_found" });
      }

      const recipientEmail = option.nominatedByEmail || option.email;
      if (!recipientEmail) {
        return NextResponse.json({ success: true, channel: "none", skipped: "no_recipient_email" });
      }

      const [category, event] = await Promise.all([
        prisma.votingCategory.findUnique({ where: { id: option.categoryId! }, select: { name: true } }),
        prisma.event.findUnique({ where: { id: option.eventId }, select: { title: true } }),
      ]);

      const emailHtml = await render(
        React.createElement(NominationConfirmationEmail, {
          recipientName: option.nominatedByName || recipientEmail,
          nomineeName: option.optionText,
          categoryName: category?.name || "this category",
          eventName: event?.title || "this event",
          deletionCode: option.deletionCode,
        })
      );

      const fromName = process.env.SMTP_FROM_NAME || "Afrotix";
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      const subject = option.deletionCode
        ? `Your nomination for ${event?.title || "the event"} is live — exit key inside`
        : `Nomination received for ${event?.title || "the event"} — pending review`;

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        subject,
        html: emailHtml,
      });

      const existingMetadata = typeof payment.metadata === "object" && payment.metadata !== null ? payment.metadata : {};
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...existingMetadata,
            nomination_email_sent_at: new Date().toISOString(),
            nomination_email_to: recipientEmail,
            nomination_email_message_id: info.messageId,
          },
        },
      });

      return NextResponse.json({ success: true, channel: "email", messageId: info.messageId });
    }

    // 3. Legacy credit-based delivery path for other payment types (Votes etc)
    const organizer = payment.userId
      ? await prisma.profile.findUnique({
          where: { id: payment.userId },
          select: { id: true, communicationCredits: true, whatsappOptIn: true },
        })
      : null;

    if (!organizer) {
      return NextResponse.json({ success: true, channel: "none", skipped: "missing_profile" });
    }

    let channel = organizer.whatsappOptIn ? "whatsapp" : "sms";
    let requiredCredits = organizer.whatsappOptIn ? 1.5 : 1.0;

    if (Number(organizer.communicationCredits) < requiredCredits) {
      channel = "email";
      requiredCredits = 0;
    }

    if (requiredCredits > 0) {
      await prisma.profile.update({
        where: { id: organizer.id },
        data: { communicationCredits: Number(organizer.communicationCredits) - requiredCredits },
      });
    }

    return NextResponse.json({ success: true, channel, creditsDeducted: requiredCredits });

  } catch (err: any) {
    console.error("Delivery error:", err);
    return NextResponse.json({ error: "Internal Error", details: err.message }, { status: 500 });
  }
}
