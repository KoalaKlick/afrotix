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
import * as React from "react";

interface EventCodeEmailProps {
  name: string;
  eventName: string;
  uniqueCode: string;
}

export const EventCodeEmail = ({
  name,
  eventName,
  uniqueCode,
}: EventCodeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your unique code for {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Afrotix Event Participation</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          You have been added as a member for the event: <strong>{eventName}</strong>.
        </Text>
        <Section style={codeSection}>
          <Text style={codeLabel}>Your Unique Code:</Text>
          <Text style={codeValue}>{uniqueCode}</Text>
        </Section>
        <Text style={text}>
          Use this code to vote or mark your attendance on the event page.
        </Text>
        <Text style={footer}>Afrotix - Empowering African Events</Text>
      </Container>
    </Body>
  </Html>
);

export default EventCodeEmail;

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
