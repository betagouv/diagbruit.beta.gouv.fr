import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface EmailProps {
  diagLink?: string;
}

export default function DiagnosticEmail({
  diagLink = "https://diagbruit.fr",
}: EmailProps) {
  const previewText = `Vous avez demandé à recevoir le diagnostic acoustique de votre parcelle.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main Content */}
          <Section>
            <Text style={paragraph}>Bonjour,</Text>
            <Text style={paragraph}>
              Vous avez demandé à recevoir le diagnostic acoustique de votre
              parcelle.
            </Text>
          </Section>
          <Button
            href={`${diagLink}&mtm_campaign=recevoirmondiag`}
            target="_blank"
            style={button}
          >
            <Row>
              <Column style={{ width: "20px", verticalAlign: "middle" }}>
                <Img
                  src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/btnIcon.svg`}
                  alt="button Icon"
                  width="16"
                  height="16"
                />
              </Column>
              <Column style={{ paddingLeft: "8px", verticalAlign: "middle" }}>
                <Text style={buttonText}>Accéder à mon diagnostic</Text>
              </Column>
            </Row>
          </Button>
          <Section>
            <Text style={paragraph}>
              Ce diagnostic vous permet de consulter les réglementations en
              vigueur ainsi que nos préconisations et conseils techniques
              adaptés au niveau d'exposition au bruit de votre parcelle.
            </Text>
          </Section>
          <Section>
            <Text style={paragraph}>
              <strong>Besoin d'accompagnement ? </strong>
              Si vous avez des questions complémentaires sur les nuisances
              sonores ou si vous souhaitez être mis en contact avec un bureau
              d'études pour une analyse acoustique plus approfondie, notre
              équipe est là pour vous accompagner. Vous pouvez nous contacter en
              répondant à cet email.
            </Text>
          </Section>
          <Section>
            <Text style={paragraph}>
              <strong>Votre avis nous intéresse ! </strong>
              Aidez-nous à améliorer diagBruit en partageant votre retour
              d'expérience.
              <Link
                href={"https://tally.so/popup/1A4kZL"}
                target="_blank"
                style={linkStyle}
              >
                Donner mon avis (1 min)
              </Link>
            </Text>
          </Section>
          {/* Footer */}
          <Section>
            <Row>
              <Column className="w-2/3">
                <Img
                  src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/footerImage.svg`}
                  alt="DiagBruit"
                  style={{ paddingRight: "8px" }}
                />
              </Column>
              <Column align="right" style={footerTextColumn}>
                <Text style={footerText}>
                  Cordialement,
                  <br />
                  L'équipe diagBruit
                  <br />
                  <Link style={{ color: "#000091" }}>contact@diagbruit.fr</Link>
                </Text>
                <Text style={footerText}>
                  <em>
                    Service public proposé à titre de conseil pour alerter sur
                    l'exposition sonore des parcelles, réalisé avec l'appui du
                    Cerema et de l'ANCT.
                  </em>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  fontFamily:
    '"Marianne", -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  fontSize: "14px",
  backgroundColor: "#ffffff",
};

const container: React.CSSProperties = {
  maxWidth: "920px",
  margin: "0 auto",
  padding: "20px",
};

const footerText: React.CSSProperties = {
  margin: "8px 0",
  lineHeight: "1.5",
  color: "#333333",
  textAlign: "justify",
};

const footerTextColumn: React.CSSProperties = {
  borderLeft: "1px solid #DDDDDD",
  paddingLeft: "16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#333333",
  marginBottom: "16px",
};

const button: React.CSSProperties = {
  color: "#F5F5FE",
  display: "inline-block",
  width: "fit-content",
  backgroundColor: "#000091",
  textDecoration: "none",
  paddingLeft: "16px",
  paddingRight: "16px",
};

const buttonText: React.CSSProperties = {
  color: "#F5F5FE",
  fontSize: "14px",
  lineHeight: "1.5",
  marginTop: "8px",
  marginBottom: "8px",
};

const linkStyle: React.CSSProperties = {
  color: "#000091",
  textDecoration: "underline",
  marginLeft: "1px",
};
