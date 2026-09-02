import { Body, Button, Column, Container, Font, Head, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components';

const FONTS_BASE_URL = `${process.env.STRAPI_URL || "http://localhost:1337"}/fonts`;

interface EmailProps {
  diagLink?: string;
  pdfUrl?: string;
  parcelNumber?: string;
}

const Footer = () => (
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
)

export default function DiagnosticEmail({
  diagLink = "https://diagbruit.fr",
  pdfUrl,
  parcelNumber,
}: EmailProps) {
  const previewText = `Vous avez demandé à recevoir le diagnostic acoustique de votre parcelle.`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Marianne"
          fallbackFontFamily="Arial"
          webFont={{
            url: `${FONTS_BASE_URL}/Marianne-Regular.woff`,
            format: "woff",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Marianne"
          fallbackFontFamily="Arial"
          webFont={{
            url: `${FONTS_BASE_URL}/Marianne-Bold.woff`,
            format: "woff",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main Content */}
          <Section>
            <Text style={paragraph}>Bonjour,</Text>
            <Text style={paragraph}>
              Merci d'avoir utilisé diagBruit. Votre diagnostic pour la parcelle n°{parcelNumber} est désormais disponible au téléchargement :
            </Text>
          </Section>
          <Section>
            {pdfUrl && (
              <Button href={pdfUrl} target="_blank" style={primaryButton}>
                Télécharger mon diagnostic (PDF)
              </Button>
            )}
            <Button
              href={`${diagLink}&mtm_campaign=recevoirmondiag`}
              target="_blank"
              style={secondaryButton}
            >
              Consulter mon diagnostic en ligne
            </Button>
          </Section>
          <Section>
            <Text style={paragraph}>
              Ce document vous informe de l’environnement sonore de votre parcelle en s’appuyant sur des données officielles. Nous vous recommandons d’affiner cette étude en réalisant une étude acoustique par un spécialiste.
            </Text>
            <Text style={paragraph}>
              <strong> Une question sur les résultats obtenus ?</strong>
            </Text>
            <Text style={paragraph}>
              Nos équipes peuvent vous accompagner dans leur compréhension. Répondez simplement à cet email et nous reviendrons vers vous dans les meilleurs délais.
            </Text>
            <Text style={paragraph}>
              Vous pouvez également consulter notre bibliothèque de préconisations pour découvrir des conseils d'implantation, d'aménagement et de conception :{" "}
              <Link
                href={"https://diagbruit.fr/preco"}
                target="_blank"
                style={linkStyle}
              >
                Consulter la médiathèque de préconisations
              </Link>
            </Text>

          </Section>
          <Section>
            <Text style={paragraph}>
              Merci pour votre confiance,
              <br />
              L'équipe diagBruit
            </Text>
          </Section>
          <Section>
            <Text style={paragraph}>
              <strong>Avez-vous trouvé nos informations utiles ?</strong>
            </Text>
          </Section>
          <Section style={{ marginBottom: "16px" }}>
            <Row>
              <Column style={{ width: "1px", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                <Button
                  href={"https://tally.so/popup/1A4kZL"}
                  target="_blank"
                  style={secondaryButton}
                >
                  Je partage mon avis
                </Button>
              </Column>
              <Column style={{ verticalAlign: "middle", paddingLeft: "8px" }}>
                <Text style={hintText}>(temps de réponse : 1 min)</Text>
              </Column>
            </Row>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export const FollowUpEmail = () => {
  const previewText = `Vous avez récemment consulté un diagnostic sur diagBruit.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main Content */}
          <Section>
            <Row>
              <Column className="w-2/3" style={{ verticalAlign: "top" }}>
                <Img
                  src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/brandIconText.svg`}
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
          <Footer />
        </Container>
      </Body>
    </Html>
  )
}


const main: React.CSSProperties = {
  fontFamily:
    '"Marianne", -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  fontSize: "16px",
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
  fontSize: "16px",
};

const footerTextColumn: React.CSSProperties = {
  borderLeft: "1px solid #DDDDDD",
  paddingLeft: "16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#333333",
  marginBottom: "16px",
};

const primaryButton: React.CSSProperties = {
  color: "#ffffff",
  backgroundColor: "#000091",
  border: "1px solid #000091",
  fontSize: "16px",
  fontWeight: 500,
  textDecoration: "none",
  display: "inline-block",
  padding: "8px 12px",
  marginRight: "8px",
};

const secondaryButton: React.CSSProperties = {
  color: "#000091",
  backgroundColor: "#ffffff",
  border: "1px solid #000091",
  fontSize: "16px",
  fontWeight: 500,
  textDecoration: "none",
  display: "inline-block",
  padding: "8px 12px",
};

const linkStyle: React.CSSProperties = {
  color: "#000091",
  textDecoration: "underline",
  marginLeft: "1px",
};

const hintText: React.CSSProperties = {
  color: "#929292",
  fontSize: "16px",
  fontWeight: 400,
  margin: 0,
};