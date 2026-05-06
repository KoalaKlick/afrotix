import { render } from "@react-email/render";
import transporter from "./mail";
import { EventCodeEmail } from "../emails/event-code";
import { NominationConfirmationEmail } from "../emails/nomination-confirmation";
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
