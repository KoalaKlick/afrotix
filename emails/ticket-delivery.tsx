import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Img,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface TicketDeliveryEmailProps {
  buyerName: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  organizationContactEmail?: string | null;
  eventTitle: string;
  eventStartDate: string | null;
  venueName: string | null;
  venueCity: string | null;
  orderNumber: string;
  subtotal: number;
  currency: string;
  ticketCount: number;
  ticketUrls: string[];
  lineItems: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
}

export const TicketDeliveryEmail = ({
  buyerName,
  organizationName,
  organizationLogoUrl,
  organizationContactEmail,
  eventTitle,
  eventStartDate,
  venueName,
  venueCity,
  orderNumber,
  subtotal,
  currency,
  ticketCount,
  ticketUrls,
  lineItems,
}: TicketDeliveryEmailProps) => {
  const displayVenue = [venueName, venueCity].filter(Boolean).join(", ") || "Venue TBA";
  const displayDate = eventStartDate 
    ? new Date(eventStartDate).toLocaleString("en-GH", { dateStyle: "full", timeStyle: "short" }) 
    : "Date TBA";

  return (
    <Html>
      <Head />
      <Preview>Your tickets for {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Pan-African accent bar */}
          <Row style={accentBar}>
            <Column style={{ ...accentSegment, background: "#9b1c1c" }} />
            <Column style={{ ...accentSegment, background: "#d97706" }} />
            <Column style={{ ...accentSegment, background: "#16a34a" }} />
          </Row>

          {/* Header */}
          <Section style={header}>
            <Text style={brandName}>AfroTix</Text>
            <Text style={tagline}>Empowering African Events</Text>
          </Section>

          <Hr style={divider} />

          {/* Body */}
          <Section style={body}>
            <Text style={greeting}>Hello {buyerName},</Text>

            <Text style={paragraph}>
              Thank you for your purchase. Your tickets for <strong>{eventTitle}</strong> are confirmed.
            </Text>

            <Section style={eventCard}>
              <Text style={eventLabel}>Event Details</Text>
              <Text style={eventTitleText}>{eventTitle}</Text>
              <Text style={eventInfo}>📅 {displayDate}</Text>
              <Text style={eventInfo}>📍 {displayVenue}</Text>
              <Text style={eventInfo}>🔢 Order #{orderNumber}</Text>
            </Section>

            <Section style={summarySection}>
              <Text style={summaryLabel}>Order Summary</Text>
              {lineItems.map((item, i) => (
                <Row key={i} style={itemRow}>
                  <Column align="left">
                    <Text style={itemText}>{item.quantity}x {item.name}</Text>
                  </Column>
                  <Column align="right">
                    <Text style={itemPrice}>{item.currency} {(item.unitPrice * item.quantity).toFixed(2)}</Text>
                  </Column>
                </Row>
              ))}
              <Hr style={innerDivider} />
              <Row>
                <Column align="left">
                  <Text style={totalLabel}>Total Paid</Text>
                </Column>
                <Column align="right">
                  <Text style={totalValue}>{currency} {subtotal.toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={ctaSection}>
              {ticketUrls.map((url, i) => (
                <Button key={i} style={ctaButton} href={url}>
                  {ticketCount > 1 ? `View Ticket #${i + 1}` : "View My Ticket"}
                </Button>
              ))}
            </Section>

            <Text style={hintText}>
              Present your ticket QR code at the venue entrance. You can download or print your tickets for easier access.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Organized by <strong>{organizationName}</strong>
            </Text>
            <Text style={footerText}>
              Questions? Contact {organizationContactEmail || "support@afrotix.com"}
            </Text>
            <Hr style={{ ...innerDivider, margin: "16px 0" }} />
            <Text style={footerText}>
              © {new Date().getFullYear()} AfroTix · Empowering African Events
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketDeliveryEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "12px",
  overflow: "hidden",
  maxWidth: "520px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
};

const accentBar = {
  width: "100%",
};

const accentSegment = {
  height: "4px",
  width: "33.33%",
};

const header = {
  padding: "28px 40px 20px",
  textAlign: "center" as const,
};

const brandName = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#111827",
  letterSpacing: "-0.5px",
  margin: "0",
  textTransform: "uppercase" as const,
};

const tagline = {
  fontSize: "12px",
  color: "#6b7280",
  margin: "4px 0 0",
  letterSpacing: "0.04em",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const body = {
  padding: "32px 40px",
};

const greeting = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 20px",
};

const eventCard = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px",
  border: "1px solid #e5e7eb",
};

const eventLabel = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};

const eventTitleText = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 12px",
};

const eventInfo = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0 0 4px",
};

const summarySection = {
  margin: "0 0 24px",
};

const summaryLabel = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 12px",
};

const itemRow = {
  margin: "0 0 8px",
};

const itemText = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0",
};

const itemPrice = {
  fontSize: "14px",
  color: "#111827",
  fontWeight: "500",
  margin: "0",
};

const innerDivider = {
  borderColor: "#f3f4f6",
  margin: "12px 0",
};

const totalLabel = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#111827",
  margin: "0",
};

const totalValue = {
  fontSize: "16px",
  fontWeight: "800",
  color: "#9b1c1c",
  margin: "0",
};

const ctaSection = {
  margin: "28px 0",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#9b1c1c",
  color: "#ffffff",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "700",
  padding: "14px 32px",
  textDecoration: "none",
  display: "block",
  margin: "0 0 10px",
};

const hintText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#9ca3af",
  margin: "0",
  textAlign: "center" as const,
};

const footerSection = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 4px",
};
