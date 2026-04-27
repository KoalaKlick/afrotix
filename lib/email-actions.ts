import { render } from "@react-email/render";
import transporter from "./mail";
import { EventCodeEmail } from "../emails/event-code";
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
