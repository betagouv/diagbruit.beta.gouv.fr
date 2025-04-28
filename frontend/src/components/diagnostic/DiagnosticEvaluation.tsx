import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { LEGAL_TEXTS } from "../../utils/texts/legal";
import { getReadableSource } from "../../utils/tools";
import { DiagnosticItem } from "../../utils/types";

type DiagnosticEvaluationProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticEvaluation = ({
  diagnosticItem,
}: DiagnosticEvaluationProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: { soundclassification_intersections, air_intersections },
  } = diagnosticItem;

  const getSoundClassificationHeaderLine = () => {
    const hasMany = soundclassification_intersections.length > 1;
    return hasMany
      ? LEGAL_TEXTS.SOUNDCLASSIFICATION.INTRODUCTION.MULTIPLE_IMPACTS
      : LEGAL_TEXTS.SOUNDCLASSIFICATION.INTRODUCTION.SINGLE_IMPACT;
  };

  return (
    <div>
      <div className={cx(classes.container)}>
        <div>
          <img
            className={cx(classes.mainIcon)}
            src="/images/connection-lost.svg"
            width={80}
            height={80}
          />
        </div>
        <div className={classes.content}>
          <h2 className={fr.cx("fr-h5")}>
            2. Évaluation du risque selon DiagBruit
          </h2>
          {soundclassification_intersections.length > 0 && (
            <>
              <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-4v")}>
                Classement sonore
              </h3>
              <p className={cx(classes.section, fr.cx("fr-mb-0"))}>
                {getSoundClassificationHeaderLine()}
                {soundclassification_intersections.length > 0 && (
                  <>
                    <ul>
                      {soundclassification_intersections.map(
                        (soundClassification, index) => {
                          const { codeinfra, typesource, distance } =
                            soundClassification;
                          return (
                            <li key={index}>
                              La parcelle se situe à <b>{distance}</b> mètre
                              {distance > 1 ? "s" : ""} de la source{" "}
                              <b>"{codeinfra}"</b> de catégorie{" "}
                              <b>"{getReadableSource(typesource)}"</b>.
                            </li>
                          );
                        }
                      )}
                    </ul>
                    <p className={fr.cx("fr-mb-0")}>
                      {LEGAL_TEXTS.SOUNDCLASSIFICATION.DETAILS.NOTICE}
                    </p>
                  </>
                )}
              </p>
            </>
          )}
          {air_intersections.length > 0 && (
            <>
              <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
                Plan d'exposition au bruit aérien
              </h3>
              <p className={cx(classes.section, fr.cx("fr-mb-0"))}>
                La parcelle est situé dans un secteur du Plan d’Exposition au
                Bruit de "<b>{air_intersections[0].nom}</b>" :
                <ul className={fr.cx("fr-mb-0")}>
                  <li>zone : {air_intersections[0].zone}</li>
                  <li>
                    Code de l’urbanisme dédié au PEB :{" "}
                    <a
                      href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031210273"
                      target="_blank"
                    >
                      article L112-10 du code de l’urbanisme
                    </a>
                  </li>
                </ul>
              </p>
            </>
          )}
          {air_intersections.length === 0 &&
            soundclassification_intersections.length === 0 && (
              <p className={cx(classes.section, fr.cx("fr-mb-0"))}>
                {LEGAL_TEXTS.NO_IMPACT}
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

const useStyles = tss.withName(DiagnosticEvaluation.name).create(() => ({
  container: {
    display: "flex",
    ul: {
      marginTop: fr.spacing("4v"),
      li: {
        lineHeight: "1.75rem",
        "&:not(:last-child)": {
          marginBottom: fr.spacing("2v"),
        },
      },
    },
    "@media screen and (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  mainIcon: {
    padding: fr.spacing("1v"),
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v"
    )} ${fr.spacing("10v")}`,
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
  },
  content: {
    paddingTop: fr.spacing("11v"),
    "@media screen and (max-width: 768px)": {
      paddingTop: fr.spacing("2v"),
    },
  },
}));

export default DiagnosticEvaluation;
