import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import { fr } from "@codegouvfr/react-dsfr";
import { getReadableSource } from "../../utils/tools";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

type DiagnosticLegalInfosProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticLegalInfos = ({
  diagnosticItem,
}: DiagnosticLegalInfosProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: { soundclassification_intersections },
  } = diagnosticItem;

  const getSoundClassificationHeaderLine = () => {
    if (!soundclassification_intersections.length)
      return "La parcelle n'est pas impactée par un secteur du classement sonore.";

    let soundClassificationText = "";

    const hasMany = soundclassification_intersections.length > 1;
    soundClassificationText += `La parcelle est impactée par ${
      hasMany ? "plusieurs" : "un"
    } secteur${hasMany ? "s" : ""} du classement sonore.`;

    soundclassification_intersections.forEach((soundClassification) => {});

    return soundClassificationText;
  };

  return (
    <div>
      <div className={cx(classes.container)}>
        <div>
          <img src="/images/document.svg" width={80} height={80} />
        </div>
        <div className={classes.content}>
          <h2 className={cx("fr-h5")}>1. Informations réglementaires</h2>
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
                  Selon la distance de la construction à la source, la présence
                  de bâtiments ou de protections phoniques à la source,
                  l’isolation acoustique règlementaire peut varier (cf lien
                  ci-après).
                </p>
              </>
            )}
          </p>
        </div>
      </div>
      <Accordion
        className={cx(classes.accordion, fr.cx("fr-mt-10v"))}
        label="Voir plus d’informations sur la réglementation du classement sonore"
        onExpandedChange={function noRefCheck() {}}
      >
        <ul>
          <li>
            <a
              className={fr.cx("fr-link")}
              href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837"
              target="_blank"
            >
              Arrêté du 30 mai 1996
            </a>{" "}
            |{" "}
            <a
              className={fr.cx("fr-link")}
              href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290"
              target="_blank"
            >
              Arrêté du 23 juillet 2013
            </a>{" "}
            |{" "}
            <a
              className={fr.cx("fr-link")}
              href="https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf;jsessionid=7E0C81517851C74F3F89CE11CC665533"
              target="_blank"
            >
              Arrêté du 3 septembre 2013
            </a>
          </li>
          <li>
            Exemples de calculs : cette information n’est pas encore disponible.
          </li>
        </ul>
      </Accordion>
    </div>
  );
};

const useStyles = tss.withName(DiagnosticLegalInfos.name).create(() => ({
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
  accordion: {
    fontStyle: "italic",
  },
}));

export default DiagnosticLegalInfos;
