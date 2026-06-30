import { fr } from "@codegouvfr/react-dsfr";
import Footer from "@codegouvfr/react-dsfr/Footer";
import Header from "@codegouvfr/react-dsfr/Header";
import Notice from "@codegouvfr/react-dsfr/Notice";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import type { Settings } from "../utils/types";
import TallyForm from "../components/diagnostic/TallyForm";
import AddressSearch, { AddressFeature } from "../components/search/AddressSearch";
import { encode } from "../utils/compression";
import { getIsMobile } from "../utils/tools";
import { trackMatomoEvent } from "../utils/matomo";

type PublicLayoutProps = {
  children: React.ReactNode;
};

const IS_TEST = process.env.REACT_APP_ENVIRONMENT === "test";

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const { cx, classes } = useStyles();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<Settings>();

  const isMobile: boolean = getIsMobile();

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
    <main style={{ overflowX: "clip" }}>
      {IS_TEST && (
        <Notice
          title="Vous utilisez actuellement l'environnement de test de diagBruit"
          severity="warning"
          className={cx(classes.testNotice)}
        />
      )}
      <Header
        className={cx(classes.header)}
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
          ...(!isMobile ? [
            <div key="header-search" className={cx(classes.searchContainer)}>
              <AddressSearch
                id="header-address-search"
                placeholder="Rechercher une adresse..."
                light
                onValueSelected={(feature: AddressFeature | null) => {
                  trackMatomoEvent("Action", "Header address search", "header-search-address");
                  navigate({
                    pathname: "/diagnostic",
                    search: `?address=${encode(feature)}`,
                  });
                }}
              />
            </div>
          ] : []),
        ]}
        serviceTitle="diagBruit"
        serviceTagline={
          <>
            Intégrez les risques sonores dès la conception d'un projet immobilier
          </>
        }
        operatorLogo={{
          alt: "Cerema, climat et territoires de demain",
          imgUrl: "/images/cerema.svg",
          orientation: "horizontal",
        }}
        homeLinkProps={{
          href: "/",
          title: "Accueil - diagBruit",
        }}
        navigation={[
          {
            isActive: pathname === "/",
            linkProps: {
              href: '/',
              target: '_self'
            },
            text: 'Accueil'
          },
          {
            isActive: pathname.startsWith("/diagnostic"),
            linkProps: {
              href: '/diagnostic',
              target: '_self'
            },
            text: 'Diagnostiquer une parcelle'
          },
          {
            isActive: pathname.startsWith("/preco"),
            linkProps: {
              href: '/preco',
              target: '_self'
            },
            text: 'Se protéger du bruit'
          }
        ]}
        id="fr-header-simple-header"
      />
      <Notice
        title={
          <>
            Aidez-nous à améliorer cet outil ! Faites nous part de vos retours
            en remplissant{" "}
            <a href="#tally-open=1A4kZL&tally-layout=modal&tally-width=500">
              ce court formulaire
            </a>
          </>
        }
        className={cx(classes.betaNotice)}
      />
      <div
        className={cx(classes.container, fr.cx("fr-container", "fr-pt-10v"))}
      >
        {children}
        <TallyForm />
      </div>
      <Footer
        accessibility="non compliant"
        accessibilityLinkProps={{
          href: "/accessibility",
        }}
        bottomItems={[
          {
            text: "Mentions légales",
            linkProps: { href: "/legal-mentions" },
          },
          {
            text: "Politique de confidentialité",
            linkProps: { href: "/privacy-policy" },
          },
          {
            text: "Documentation",
            linkProps: {
              target: "_blank",
              href: "https://docs.numerique.gouv.fr/docs/da3f8dd6-f9f2-4a4c-9548-952e076f699d/",
            },
          },
        ]}
        contentDescription="diagBruit est un outil d’aide à la décision simple et rapide qui permet aux instructeurs ADS d’évaluer l’exposition sonore d’une parcelle et de mieux intégrer les enjeux acoustiques dans leurs préconisations auprès des porteurs de projets immobiliers."
      />
    </main>
  );
};

const useStyles = tss.create(() => ({
  container: {
    minHeight: "85vh",
  },
  header: {
    "& .fr-header__tools-links .fr-btns-group": {
      flexDirection: "column" as const,
      alignItems: "flex-end !important" as const,
      gap: fr.spacing("1v"),
      "&&": {
        flexDirection: "column" as const,
        alignItems: "flex-end !important" as const,
      },
      li: {
        width: "100%",
        justifyContent: "right",
      },
      width: "350px",
      a: {
        marginBottom: fr.spacing("1v")
      }
    },
  },
  searchContainer: {
    width: "100%",
    "&& .fr-btn:disabled": {
      backgroundColor: `${fr.colors.decisions.background.disabled.grey.default} !important`,
    },
    "&& .fr-btn:enabled": {
      backgroundColor: `${fr.colors.decisions.background.actionHigh.blueFrance.default} !important`,
      color: "#ffffff !important",
    }
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
