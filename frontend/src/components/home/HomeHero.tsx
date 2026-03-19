import { fr } from "@codegouvfr/react-dsfr";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { tss } from "tss-react/dsfr";

const HomeHero = () => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-8", "fr-pr-8v")}>
          <h1>
            Comprendre rapidement le risque sonore <br /> sur une parcelle
            cadastrale
          </h1>
          <p className={fr.cx("fr-mb-4v")}>
            <b>diagBruit</b> est un outil qui vise deux objectifs :
          </p>
          <ol className={fr.cx("fr-mb-6v")}>
            <li>
              <b>Alerter</b> les porteurs de projet et services à propos des
              risques induits par la situation sonore d’une parcelle.
            </li>
            <li>
              <b>Proposer</b> des pistes de réflexions pour réaliser des
              aménagements prenant en compte la dimension acoustique.
            </li>
          </ol>
          <Notice
            description={
              <>
                Attention ! DiagBruit ne prend en compte{" "}
                <b>
                  que les sources sonores routières, ferroviaires et
                  aéroportuaires
                </b>
                . Le diagnostic{" "}
                <b>
                  se base sur les Cartes de Bruit Stratégiques, les Plans
                  d’Exposition au Bruit et les Classements Sonores des Voies
                </b>
                . Ces documents sont issus de modélisation qui nécessitent
                certaines approximations, une étude locale approfondie reste le
                moyen le plus sur d’estimer le risque sonore réel prenant en
                compte l’ensemble des sources
              </>
            }
            iconDisplayed
            isClosable
            onClose={function noRefCheck() { }}
            severity="info"
            title=""
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <img
            src="/images/homehero.svg"
            alt="Illustration d'un diagnostic diagBruit"
          />
        </div>
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    h1: {
      ...fr.typography[4].style,
    },
    img: {
      maxWidth: "100%",
      position: "relative",
      top: "50%",
      transform: "translateY(-50%)",
    },
    ol: {
      "li::marker": {
        fontWeight: "normal",
      },
    },
    ".fr-notice__body": {
      ".fr-notice__desc": {
        ...fr.typography[17].style,
      },
      button: {
        display: "none",
      },
    },
    [fr.breakpoints.down("md")]: {
      ".fr-grid-row": {
        flexDirection: "column-reverse",
      },
    },
  },
}));

export default HomeHero;
