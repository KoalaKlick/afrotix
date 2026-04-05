type TicketLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

type TicketPurchaseEmailInput = {
  buyerName?: string | null;
  organizationName: string;
  organizationLogoUrl?: string | null;
  organizationContactEmail?: string | null;
  eventTitle: string;
  eventStartDate?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  orderNumber: string;
  subtotal: number;
  currency: string;
  ticketCount: number;
  ticketUrls?: string[];
  lineItems: TicketLineItem[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    return new Intl.DateTimeFormat("en-GH", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Africa/Accra",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function renderLineItems(lineItems: TicketLineItem[]): string {
  return lineItems
    .map((item) => {
      const total = item.quantity * item.unitPrice;

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e2e8f0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">
            <strong>${escapeHtml(item.name)}</strong><br />
            <span style="color: #718096;">${item.quantity} x ${formatMoney(item.unitPrice, item.currency)}</span>
          </td>
          <td align="right" style="padding: 14px 0; border-bottom: 1px solid #e2e8f0; color: #1a1a1a; font-size: 14px; font-weight: 700;">
            ${formatMoney(total, item.currency)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTicketLinks(ticketUrls: string[]): string {
  if (!ticketUrls.length) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f7fafc; border-radius: 8px; margin-top: 24px;">
        <tr>
          <td style="padding: 18px;">
            <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
              Your ticket download link will be attached here as soon as issuance is completed.
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  const links = ticketUrls
    .map((url, index) => {
      const safeUrl = escapeHtml(url);
      return `
        <tr>
          <td style="padding: 0 0 12px;">
            <a href="${safeUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 600;">
              Download Ticket ${index + 1}
            </a>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 15px; font-weight: 700;">
            Your ticket link${ticketUrls.length > 1 ? "s are" : " is"} ready
          </p>
        </td>
      </tr>
      ${links}
    </table>
  `;
}

export function buildTicketPurchaseEmail(input: TicketPurchaseEmailInput): {
  subject: string;
  html: string;
} {
  const buyerName = input.buyerName?.trim() || "there";
  const formattedDate = formatDate(input.eventStartDate);
  const location = [input.venueName, input.venueCity].filter(Boolean).join(", ");
  const ticketUrls = input.ticketUrls ?? [];
  const logoBlock = input.organizationLogoUrl
    ? `
      <img
        src="${escapeHtml(input.organizationLogoUrl)}"
        alt="${escapeHtml(input.organizationName)}"
        width="180"
        style="
          display: block;
          margin: 0 auto;
          max-width: 180px;
          height: auto;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 4px;
          background-color: #000000;
        "
      />
    `
    : `
      <div style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.08em; padding: 16px 22px;">
        ${escapeHtml(input.organizationName)}
      </div>
    `;

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family:
        -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto,
        &quot;Helvetica Neue&quot;, Arial, sans-serif;
      background-color: #f6f9fc;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f6f9fc; padding: 40px 0;">
      <tr>
        <td align="center">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
              max-width: 600px;
            "
          >
            <tr>
              <td style="padding: 0;">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  <tr>
                    <td width="200" style="background-color: #c41e3a; height: 6px; line-height: 6px; font-size: 1px;">&nbsp;</td>
                    <td width="200" style="background-color: #ffb800; height: 6px; line-height: 6px; font-size: 1px;">&nbsp;</td>
                    <td width="200" style="background-color: #228b22; height: 6px; line-height: 6px; font-size: 1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 48px 48px 32px; text-align: center; background-color: #ffffff;">
                ${logoBlock}
              </td>
            </tr>

            <tr>
              <td style="padding: 20px 48px 40px;">
                <h1 style="color: #1a1a1a; margin: 0 0 16px; font-size: 28px; font-weight: 700; line-height: 1.3;">
                  Your ticket is confirmed
                </h1>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
                  Hi <strong>${escapeHtml(buyerName)}</strong>,
                </p>

                <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 28px;">
                  Your purchase for <strong>${escapeHtml(input.eventTitle)}</strong> has been confirmed. Keep this email handy for your order summary and ticket access.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f7fafc; border-radius: 12px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 20px 22px;">
                      <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 18px; font-weight: 700;">
                        ${escapeHtml(input.eventTitle)}
                      </p>
                      <p style="margin: 0 0 6px; color: #4a5568; font-size: 14px;">Order: <strong>${escapeHtml(input.orderNumber)}</strong></p>
                      <p style="margin: 0 0 6px; color: #4a5568; font-size: 14px;">Tickets: <strong>${input.ticketCount}</strong></p>
                      ${formattedDate ? `<p style="margin: 0 0 6px; color: #4a5568; font-size: 14px;">Date: <strong>${escapeHtml(formattedDate)}</strong></p>` : ""}
                      ${location ? `<p style="margin: 0; color: #4a5568; font-size: 14px;">Venue: <strong>${escapeHtml(location)}</strong></p>` : ""}
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td>
                      <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 15px; font-weight: 700;">Purchase summary</p>
                    </td>
                  </tr>
                  ${renderLineItems(input.lineItems)}
                  <tr>
                    <td style="padding: 16px 0 0; color: #1a1a1a; font-size: 15px; font-weight: 700;">Total paid</td>
                    <td align="right" style="padding: 16px 0 0; color: #1a1a1a; font-size: 16px; font-weight: 800;">
                      ${formatMoney(input.subtotal, input.currency)}
                    </td>
                  </tr>
                </table>

                ${renderTicketLinks(ticketUrls)}

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fffbeb; border-radius: 8px; margin-top: 24px;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        Use the same email and phone number from your purchase if support needs to verify your order.
                      </p>
                    </td>
                  </tr>
                </table>

                ${
                  input.organizationContactEmail
                    ? `
                  <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                    Need help? Contact ${escapeHtml(input.organizationName)} at
                    <a href="mailto:${escapeHtml(input.organizationContactEmail)}" style="color: #1a1a1a; font-weight: 600; text-decoration: none;">
                      ${escapeHtml(input.organizationContactEmail)}
                    </a>.
                  </p>
                `
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding: 0;">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  <tr>
                    <td width="200" style="background-color: #c41e3a; height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</td>
                    <td width="200" style="background-color: #ffb800; height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</td>
                    <td width="200" style="background-color: #228b22; height: 4px; line-height: 4px; font-size: 1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 48px; background-color: #f7fafc;">
                <p style="color: #a0aec0; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
                  This email confirms your purchase with ${escapeHtml(input.organizationName)}.
                </p>
                <p style="color: #cbd5e0; font-size: 12px; margin: 0;">
                  &copy; 2026 ${escapeHtml(input.organizationName)}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  return {
    subject: `${input.eventTitle} ticket purchase confirmed`,
    html,
  };
}
