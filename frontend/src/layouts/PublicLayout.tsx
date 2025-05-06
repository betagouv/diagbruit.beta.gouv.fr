import { fr } from "@codegouvfr/react-dsfr";
import Header from "@codegouvfr/react-dsfr/Header";
import Footer from "@codegouvfr/react-dsfr/Footer";
import { tss } from "tss-react/dsfr";

type PublicLayoutProps = {
  children: React.ReactNode;
};

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const { cx, classes } = useStyles();

  return (
    <main>
      <Header
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        serviceTitle="diagBruit"
        serviceTagline={
          <>
            Intégrer le bruit dans les risques impactant les projets
            d'aménagement
          </>
        }
        operatorLogo={{
          alt: "Cerema, climat et territoires de demain",
          imgUrl: "images/cerema.svg",
          orientation: "horizontal",
        }}
        homeLinkProps={{
          href: "/",
          title: "Accueil - diagBruit",
        }}
        id="fr-header-simple-header"
      />
      <div
        className={cx(classes.container, fr.cx("fr-container", "fr-py-10v"))}
      >
        {children}
      </div>
      <Footer
        accessibility="non compliant"
        contentDescription="diagBruit est un outil d’aide à la décision simple et rapide qui permet aux instructeurs ADS d’évaluer l’exposition sonore d’une parcelle et de mieux intégrer les enjeux acoustiques dans leurs préconisations auprès des porteurs de projets immobiliers."
      />
    </main>
  );
};

const useStyles = tss.create(() => ({
  container: {
    minHeight: "85vh",
  },
}));

export default PublicLayout;
