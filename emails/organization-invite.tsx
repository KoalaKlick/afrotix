import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrganizationInviteEmailProps {
  inviteeName?: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  expiresInDays?: number;
}

export const OrganizationInviteEmail = ({
  inviteeName,
  inviterName,
  organizationName,
  role,
  inviteUrl,
  expiresInDays = 7,
}: OrganizationInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {inviterName} has invited you to join {organizationName} on AfroTix
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
          <Text style={greeting}>
            Hello{inviteeName ? ` ${inviteeName}` : ""},
          </Text>

          <Text style={paragraph}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{organizationName}</strong> on AfroTix as a{" "}
            <span style={roleBadge}>{role}</span>.
          </Text>

          <Text style={paragraph}>
            AfroTix is a platform for managing and promoting African events.
            By accepting this invitation, you'll have access to the{" "}
            <strong>{organizationName}</strong> workspace right away — no
            complicated setup required.
          </Text>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={hint}>
            This invitation link expires in{" "}
            <strong>{expiresInDays} days</strong>. If you weren't expecting
            this email, you can safely ignore it.
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            If the button above doesn't work, copy and paste this URL into your
            browser:
          </Text>
          <Text style={footerLink}>{inviteUrl}</Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} AfroTix · Empowering African Events
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrganizationInviteEmail;

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

const roleBadge = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
  borderRadius: "4px",
  padding: "2px 8px",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "capitalize" as const,
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
  display: "inline-block",
};

const hint = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#9ca3af",
  margin: "0",
};

const footerSection = {
  padding: "20px 40px 28px",
  backgroundColor: "#f9fafb",
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const footerLink = {
  fontSize: "11px",
  color: "#6b7280",
  margin: "0 0 12px",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
};
