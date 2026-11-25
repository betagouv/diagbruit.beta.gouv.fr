import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import IsolationRegulationPicto from "./IsolationRegulationPicto";

type RegulationIsolationRangeProps = {
  isolationMin: number | null;
  isolationMax: number | null;
};

const RegulationIsolationRange = ({
  isolationMin,
  isolationMax,
}: RegulationIsolationRangeProps) => {
  const { classes } = useStyles();

  return (
    <div className={classes.card}>
      <div className={classes.summary}>
        <p className={classes.range}>
          {isolationMin} <span className={classes.rangeSmall}>à</span>{" "}
          {isolationMax} <span className={classes.rangeSmall}>dB</span>
        </p>
        <div>
          <p className={fr.cx("fr-mb-1v")}>
            L’outil diagBruit propose, <strong>à titre indicatif</strong>, une
            fourchette d’isolation minimale située entre{" "}
            <strong>
              {isolationMin} et {isolationMax} dB.
            </strong>
          </p>
          <p className={fr.cx("fr-text--sm", "fr-text--bold", "fr-mb-0")}>
            Cette préconisation ne se substitue, en aucun cas, à une étude
            acoustique.
          </p>
        </div>
      </div>

      <figure className={classes.illustration}>
        <div className={classes.picto}>
          <IsolationRegulationPicto
            nearLabel={`${isolationMax} dB`}
            farLabel={`${isolationMin} dB`}
          />
        </div>
        <figcaption className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-4v")}>
          Seuil le plus haut recommandé{" "}
          <span className={fr.cx("fr-icon-arrow-right-line", "fr-icon--sm")} aria-hidden="true" />{" "}
          Seuil minimal réglementaire
        </figcaption>
      </figure>
    </div>
  );
};

export default RegulationIsolationRange;

const useStyles = tss.create(() => ({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("4v"),
    padding: fr.spacing("4v"),
    marginBottom: fr.spacing("6v"),
    backgroundColor: fr.colors.decisions.background.contrast.blueFrance.default,
    border: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
    borderRadius: fr.spacing("1v"),
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    gap: fr.spacing("4v"),
    [fr.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  range: {
    margin: 0,
    textAlign: "center",
    fontSize: "2.5rem",
    lineHeight: "3rem",
    fontWeight: 700,
    color: fr.colors.decisions.text.title.blueFrance.default,
  },
  rangeSmall: {
    fontSize: "1.5rem",
  },
  illustration: {
    margin: 0,
    padding: `${fr.spacing("4v")} ${fr.spacing("4v")} ${fr.spacing("3v")}`,
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  picto: {
    width: "100%",
    maxWidth: "303px",
  },
}));
