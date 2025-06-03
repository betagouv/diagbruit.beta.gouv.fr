import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import { fr } from "@codegouvfr/react-dsfr";
import { getReadableSource } from "../../utils/tools";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { LEGAL_TEXTS } from "../../utils/texts/legal";

type DiagnosticLegalInfosProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticLegalInfos = ({
  diagnosticItem,
}: DiagnosticLegalInfosProps) => {
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
        {soundclassification_intersections.length > 0 && (
          <>
            <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-4v")}>
              Classement sonore
            </h3>
            <div className={cx(classes.section)}>
              {getSoundClassificationHeaderLine()}
              {soundclassification_intersections.length > 0 && (
                <>
                  <ul>
                    {soundclassification_intersections.map(
                      (soundClassification, index) => {
                        const {
                          codeinfra,
                          typesource,
                          sound_category,
                          distance,
                        } = soundClassification;
                        return (
                          <li key={index}>
                            La parcelle se situe à <b>{distance}</b> mètre
                            {distance > 1 ? "s" : ""} de la source{" "}
                            <b>"{codeinfra}"</b> de type{" "}
                            <b>"{getReadableSource(typesource)}"</b> et de
                            catégorie <b>{sound_category}</b>.
                          </li>
                        );
                      }
                    )}
                  </ul>
                  <p>{LEGAL_TEXTS.SOUNDCLASSIFICATION.DETAILS.NOTICE}</p>
                  <p className={fr.cx("fr-mb-0")}>
                    Références :{" "}
                    <a
                      href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837"
                      target="_blank"
                    >
                      Arrêté du 30 mai 1996
                    </a>{" "}
                    |{" "}
                    <a
                      href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290"
                      target="_blank"
                    >
                      Arrêté du 23 juillet 2013
                    </a>{" "}
                    |{" "}
                    <a
                      href="https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf;jsessionid=7E0C81517851C74F3F89CE11CC665533"
                      target="_blank"
                    >
                      Arrêté du 3 septembre 2013
                    </a>
                  </p>
                </>
              )}
            </div>
          </>
        )}
        {air_intersections.length > 0 && (
          <>
            <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
              Plan d'exposition au bruit aérien
            </h3>
            <div className={cx(classes.section)}>
              <p className={fr.cx("fr-mb-0")}>
                La parcelle est situé dans un secteur du Plan d’Exposition au
                Bruit de "<b>{air_intersections[0].nom}</b>" :
              </p>
              <ul>
                <li>zone : {air_intersections[0].zone}</li>
              </ul>
              <p className={fr.cx("fr-mb-0")}>
                Code de l’urbanisme dédié au PEB :{" "}
                <a
                  href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031210273"
                  target="_blank"
                >
                  article L112-10 du code de l’urbanisme
                </a>
              </p>
            </div>
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
  );
};

const useStyles = tss.create(() => ({
  container: {
    ul: {
      marginLeft: fr.spacing("4v"),
      li: {
        lineHeight: "1.75rem",
        "&:not(:last-child)": {
          marginBottom: fr.spacing("2v"),
        },
      },
    },
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v"
    )} ${fr.spacing("10v")}`,
    marginLeft: fr.spacing("6v"),
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
  },
}));

export default DiagnosticLegalInfos;
