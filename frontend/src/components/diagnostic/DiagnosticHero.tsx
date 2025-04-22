import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../utils/types";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { tss } from "tss-react/dsfr";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";
import {
  getColorFromScore,
  getSummaryTextFromDiagnostic,
} from "../../utils/tools";

type DiagnosticHeroProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticHero = ({ diagnosticItem }: DiagnosticHeroProps) => {
  const { parcelle, diagnostic } = diagnosticItem;

  const { cx, classes } = useStyles({ score: diagnostic.score });

  return (
    <div className={cx(classes.container)}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <h2 className={fr.cx("fr-h6", "fr-mb-4v")}>
            <i className={cx(classes.titleIcon, fr.cx("ri-article-fill"))} />{" "}
            Caratéristiques de votre recherche
          </h2>
          <p>
            <b>Code insee :</b> {parcelle.code_insee}
            <br />
            <b>Section :</b> {parcelle.section}
            <br />
            <b>Numéro de parcelle :</b> {parcelle.numero}
          </p>
          <h2 className={fr.cx("fr-h6", "fr-mb-4v")}>
            <i className={cx(classes.titleIcon, fr.cx("ri-alert-fill"))} />{" "}
            Évaluation du risque
          </h2>
          <p>
            <DiagnosticNoiseScore
              score={diagnostic.score}
              db={diagnostic.max_db_lden}
            />
          </p>
          {diagnostic.equivalent_ambiences.length > 0 && (
            <>
              <p className={cx(classes.subTitle, fr.cx("fr-mb-2v"))}>
                Ambiances sonores équivalentes
              </p>
              <p>
                {diagnostic.equivalent_ambiences.map((ambience, index) => (
                  <Tag
                    key={index}
                    className={cx(
                      classes.ambienceTag,
                      fr.cx("fr-mr-2v", "fr-mb-2v")
                    )}
                  >
                    {ambience}
                  </Tag>
                ))}
              </p>
            </>
          )}
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <h2 className={fr.cx("fr-h6", "fr-mb-4v")}>
            <i
              className={cx(classes.titleIcon, fr.cx("ri-information-fill"))}
            />{" "}
            Résumé du diagnostic
          </h2>
          <p
            className={classes.summary}
            dangerouslySetInnerHTML={{
              __html: getSummaryTextFromDiagnostic(diagnostic),
            }}
          />
          <h2 className={fr.cx("fr-h6", "fr-mb-4v")}>
            <i className={cx(classes.titleIcon, fr.cx("ri-question-fill"))} />{" "}
            Comment agir ?
          </h2>
          <p>Consultez les rubriques à propose de votre diagnostic</p>
        </div>
      </div>
    </div>
  );
};

const useStyles = tss
  .withName(DiagnosticHero.name)
  .withParams<{
    score: number;
  }>()
  .create(({ score }) => ({
    container: {
      backgroundColor: fr.colors.decisions.background.contrast.grey.default,
      padding: fr.spacing("6v"),
    },
    titleIcon: {
      color: fr.colors.decisions.background.flat.blueFrance.default,
    },
    subTitle: {
      fontWeight: "bold",
    },
    ambienceTag: {
      backgroundColor: getColorFromScore(score),
    },
    summary: {
      p: {
        marginBottom: fr.spacing("4v"),
      },
    },
  }));

export default DiagnosticHero;
