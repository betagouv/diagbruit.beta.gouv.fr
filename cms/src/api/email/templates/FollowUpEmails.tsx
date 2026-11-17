import { Body, Container, Head, Html, Link, Section, Text } from '@react-email/components';
import { container, Footer, linkStyle, main, paragraph } from './DiagnosticEmail';


export const FollowUpEmailPlus1 = () => {

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={paragraph}>Bonjour,</Text>
            <Text style={paragraph}>
              Je suis Baudoin Cardon, membre de l'équipe <Link style={linkStyle} href="https://diagbruit.beta.gouv.fr/">diagBruit</Link>.
            </Text>
            <Text style={paragraph}>
              Suite au téléchargement de votre diagnostic hier, <strong>vous avez peut-être des questions sur les risques sonores identifiés ou les réglementations acoustiques applicables à votre projet immobilier ?</strong>
            </Text>
            <Text style={paragraph}>
              Je suis à votre disposition pour vous aider à mieux comprendre ces informations et à les prendre en compte dans votre projet.
            </Text>
            <Text style={paragraph}>
              Si vous souhaitez en discuter, n'hésitez pas à me répondre directement !
            </Text>
            <Text style={paragraph}>
              Au plaisir de vous lire,
            </Text>
            <Text style={paragraph}>
              Très cordialement,
            </Text>
            <Text style={paragraph}>
              Baudoin Cardon
            </Text>
            <Text style={paragraph}>
              <strong>Équipe diagBruit</strong>
            </Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  )
}

export const FollowUpEmailPlus7 = () => {

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={paragraph}>Bonjour,</Text>
            <Text style={paragraph}>
             Je vous recontacte au sujet du diagnostic diagBruit que vous avez récemment téléchargé. 
            </Text>
            <Text style={paragraph}>
              A-t-il eu un <strong>impact concret</strong> sur votre projet ou votre réflexion ?
            </Text>
            <Text style={paragraph}>
              Par exemple :
            </Text>
            <ul style={paragraph}>
              <li>Une adaptation de votre projet</li>
              <li>Une prise de contact avec un spécialiste</li>
              <li>Un approfondissement des enjeux liés au bruit</li>
              <li>Ou simplement la confirmation que le bruit ne nécessitait pas de démarche particulière.</li>
            </ul>
            <Text style={paragraph}>
              Quelques mots en réponse à ce mail suffisent, même si le diagnostic n'a finalement pas eu d'impact sur votre projet.
            </Text>
            <Text style={paragraph}>
              Je serais également ravi d'en discuter avec vous par téléphone si vous préférez.
            </Text>
            <Text style={paragraph}>
              Merci d'avance pour votre retour !
            </Text>
            <Text style={paragraph}>
              Très cordialement,
            </Text>
            <Text style={paragraph}>
              Baudoin Cardon
            </Text>
            <Text style={paragraph}>
              <strong>Équipe diagBruit</strong>
            </Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  )
}

export const FollowUpEmailPlus15 = ()=> {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={paragraph}>Bonjour,</Text>
            <Text style={paragraph}>
             Je me permets un dernier message concernant le diagnostic diagBruit que vous avez consulté il y a quelques semaines.
            </Text>
            <Text style={paragraph}>
             <strong>Vos retours sont vraiment importants pour notre équipe. </strong> Ils nous permettent de comprendre comment diagBruit est utilisé sur le terrain, de démontrer son utilité et de continuer à faire évoluer ce service public.
            </Text>
            <Text style={paragraph}>
             Si ce diagnostic vous a aidé à prendre une décision, à approfondir le sujet du bruit ou simplement à vérifier une information, <strong>je serais très intéressé de connaître votre expérience.</strong>
            </Text>
            <Text style={paragraph}>
             Même quelques lignes me seraient très utiles !
            </Text>
            <Text style={paragraph}>
             Merci beaucoup pour votre aide et le temps que vous pourrez m'accorder.
            </Text>
            <Text style={paragraph}>
              Très cordialement,
            </Text>
            <Text style={paragraph}>
              Baudoin Cardon
            </Text>
            <Text style={paragraph}>
              <strong>Équipe diagBruit</strong>
            </Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  )
}