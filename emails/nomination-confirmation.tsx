import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

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
        ? `Nomination confirmed for ${eventName} — keep your exit key safe`
        : `Nomination received for ${eventName} — pending review`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nomination {deletionCode ? "Confirmed" : "Received"}!</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          Your nomination of <strong>{nomineeName}</strong> for the{" "}
          <strong>{categoryName}</strong> category at <strong>{eventName}</strong> has been
          {deletionCode ? " confirmed and is now live!" : " received and is pending review by the organizers."}
        </Text>
        {deletionCode ? (
          <>
            <Section style={codeSection}>
              <Text style={codeLabel}>Your Exit Key (keep this safe)</Text>
              <Text style={codeValue}>{deletionCode}</Text>
            </Section>
            <Text style={text}>
              This 6-digit exit key is required if you ever need the nomination removed.
              Keep it safe — the event organizer will ask for it before they can delete
              the nomination.
            </Text>
          </>
        ) : (
          <Text style={text}>
            Once approved, the nominee will appear in the public list. You will be
            notified if further action is needed.
          </Text>
        )}
        <Text style={footer}>Afrotix - Empowering African Events</Text>
      </Container>
    </Body>
  </Html>
);

export default NominationConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const codeSection = {
  background: "#f4f4f4",
  borderRadius: "4px",
  margin: "16px 40px",
  padding: "24px",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#666",
  fontSize: "14px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 10px",
};

const codeValue = {
  color: "#000",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "4px",
  margin: "0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "48px",
};
