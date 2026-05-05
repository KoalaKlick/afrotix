import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Img,
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
  const previewText = `Your ${ticketCount} ticket(s) for ${eventTitle}`;
  const displayVenue = [venueName, venueCity].filter(Boolean).join(", ") || "Venue TBA";
  const displayDate = eventStartDate 
    ? new Date(eventStartDate).toLocaleString("en-GH", { dateStyle: "full", timeStyle: "short" }) 
    : "Date TBA";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {organizationLogoUrl && (
            <Section style={logoSection}>
              <Img src={organizationLogoUrl} alt={organizationName} height="40" style={logo} />
            </Section>
          )}
          
          <Heading style={h1}>Your Tickets are Here!</Heading>
          <Text style={text}>Hi {buyerName},</Text>
          <Text style={text}>
            Thank you for your purchase. Here are the details for <strong>{eventTitle}</strong> organized by {organizationName}.
          </Text>

          <Section style={eventDetails}>
            <Text style={detailText}><strong>Date:</strong> {displayDate}</Text>
            <Text style={detailText}><strong>Venue:</strong> {displayVenue}</Text>
            <Text style={detailText}><strong>Order #:</strong> {orderNumber}</Text>
          </Section>

          <Section style={orderSummary}>
            <Heading as="h3" style={h3}>Order Summary</Heading>
            {lineItems.map((item, i) => (
              <Text key={i} style={itemText}>
                {item.quantity}x {item.name} - {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
              </Text>
            ))}
            <Text style={totalText}>
              <strong>Total Paid:</strong> {currency} {subtotal.toFixed(2)}
            </Text>
          </Section>

          <Section style={btnContainer}>
            {ticketUrls.map((url, i) => (
              <Button key={i} style={button} href={url}>
                View & Download Ticket {ticketCount > 1 ? `#${i + 1}` : ""}
              </Button>
            ))}
          </Section>

          <Text style={text}>
            Please have your tickets ready for scanning at the event. You can download them for offline access.
          </Text>

          <Text style={footer}>
            Need help? Contact the organizer at {organizationContactEmail || "support@afrotix.com"}
            <br />
            Afrotix - Empowering African Events
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketDeliveryEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const logoSection = {
  textAlign: "center" as const,
  padding: "20px",
};

const logo = {
  margin: "0 auto",
  objectFit: "contain" as const,
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const h3 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "10px",
  borderBottom: "1px solid #eaeaea",
  paddingBottom: "8px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const detailText = {
  color: "#555",
  fontSize: "15px",
  margin: "4px 0",
};

const eventDetails = {
  background: "#f4f4f4",
  borderRadius: "4px",
  margin: "16px 40px",
  padding: "20px",
};

const orderSummary = {
  margin: "24px 40px",
  padding: "20px",
  border: "1px solid #eaeaea",
  borderRadius: "4px",
};

const itemText = {
  fontSize: "15px",
  color: "#555",
  margin: "8px 0",
};

const totalText = {
  fontSize: "16px",
  color: "#000",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #eaeaea",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  alignItems: "center" as const,
};

const button = {
  backgroundColor: "#009A44",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  fontWeight: "bold",
  margin: "0 auto 12px auto",
  maxWidth: "300px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
  marginTop: "48px",
};
