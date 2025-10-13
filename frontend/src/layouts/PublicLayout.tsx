import { fr } from "@codegouvfr/react-dsfr";
import Footer from "@codegouvfr/react-dsfr/Footer";
import Header from "@codegouvfr/react-dsfr/Header";
import Notice from "@codegouvfr/react-dsfr/Notice";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { Settings } from "../utils/types";
import { useLocation, useNavigate } from "react-router-dom";

type PublicLayoutProps = {
  children: React.ReactNode;
};

const IS_TEST = process.env.REACT_APP_ENVIRONMENT === "test";

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const { cx, classes } = useStyles();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<Settings>();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/setting`)
      .then((res) => {
        setSettings(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    if (settings?.maintenance && !pathname.startsWith("/maintenance")) {
      navigate("/maintenance", { replace: true });
    } else if (!settings?.maintenance && pathname.startsWith("/maintenance")) {
      navigate("/", { replace: true });
    }
  }, [settings]);

  if (settings?.maintenance) {
    return (
      <main>
        <div className={classes.maintenance}>{children}</div>
      </main>
    );
  }

  return (
    <main>
      {IS_TEST && (
        <Notice
          title="Vous utilisez actuellement l'environnement de test de diagBruit"
          severity="warning"
          className={cx(classes.testNotice)}
        />
      )}
      <Header
        brandTop={
          <>
            République
            <br />
            Française
          </>
        }
        quickAccessItems={[
          {
            iconId: "ri-flashlight-line",
            text: "Nouveautés",
            linkProps: {
              href: "/changelogs",
            },
          },
        ]}
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
      {pathname === "/diagnostic" && (
        <Notice
          title={
            <>
              Aidez-nous à améliorer cet outil ! Faites nous part de vos retours
              en remplissant{" "}
              <a href="https://tally.so/r/3xoeEd" target="_blank">
                ce court formulaire.
              </a>
            </>
          }
          isClosable
          onClose={function noRefCheck() {}}
          className={cx(classes.betaNotice)}
        />
      )}
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
  betaNotice: {
    marginBottom: `-${fr.spacing("10v")}`,
  },
  testNotice: {
    ".fr-notice__body": {
      display: "flex",
      justifyContent: "center",
    },
  },
  maintenance: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default PublicLayout;
