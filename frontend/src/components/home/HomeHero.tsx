import { tss } from "tss-react/dsfr";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { fr } from "@codegouvfr/react-dsfr";

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
          <p>
            <b>diagBruit</b> est un service public qui facilite la compréhension
            des risques liés au <b>bruit des transports</b>.
          </p>
          <Notice
            description="Actuellement, les sources de données utilisées dans l'outil sont les cartes de bruit des grandes infrastructures de transports terrestres, les cartes de bruit des grandes agglomérations, les classements sonores, les plans d'exposition au bruit."
            iconDisplayed
            isClosable
            onClose={function noRefCheck() {}}
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
