import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface NominationConfirmationEmailProps {
  recipientName: string;
  nomineeName: string;
  categoryName: string;
  eventName: string;
  deletionCode?: string | null;
}

export const NominationConfirmationEmail = ({
  recipientName,
  nomineeName,
  categoryName,
  eventName,
  deletionCode,
}: NominationConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {deletionCode
        ? `Nomination confirmed for ${eventName}`
        : `Nomination received for ${eventName}`}
    </Preview>
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
          <Text style={greeting}>Hello {recipientName},</Text>

          <Text style={paragraph}>
            Your nomination of <strong>{nomineeName}</strong> for the <strong>{categoryName}</strong> category at <strong>{eventName}</strong> has been {deletionCode ? "confirmed and is now live." : "received and is pending review."}
          </Text>

          {deletionCode ? (
            <>
              <Section style={codeSection}>
                <Text style={codeLabel}>Nomination Exit Key</Text>
                <Text style={codeValue}>{deletionCode}</Text>
              </Section>
              <Text style={hintText}>
                <strong>Security Notice:</strong> Keep this exit key safe. It is required to remove your nomination from the public list. Organizers cannot delete your entry without this key.
              </Text>
            </>
          ) : (
            <Text style={paragraph}>
              You will be notified once the event organizers have reviewed and approved your nomination for the public list.
            </Text>
          )}
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            © {new Date().getFullYear()} AfroTix · Empowering African Events
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default NominationConfirmationEmail;

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
  margin: "0 0 16px",
};

const codeSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
  border: "1px solid #e5e7eb",
};

const codeLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};

const codeValue = {
  fontSize: "32px",
  fontWeight: "800",
  color: "#9b1c1c",
  margin: "0",
  letterSpacing: "2px",
};

const hintText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#9ca3af",
  margin: "0",
};

const footerSection = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
};
