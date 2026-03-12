import { fr } from "@codegouvfr/react-dsfr";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { tss } from "tss-react/dsfr";
import {
  getColorFromScore,
  getSummaryTextFromDiagnostic,
} from "../../utils/tools";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";

type DiagnosticHeroProps = {
  diagnosticItem: DiagnosticItem;
  handleCopyUrl?: (title?: string) => void;
};

const DiagnosticHero = ({
  diagnosticItem,
}: DiagnosticHeroProps) => {
  const { diagnostic } = diagnosticItem;

  const { cx, classes } = useStyles({ score: diagnostic.score });

  return (
    <div className={cx(classes.container)}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-5")}>
          <div
            className={classes.summary}
            dangerouslySetInnerHTML={{
              __html: getSummaryTextFromDiagnostic(diagnostic),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-7")}>
          <div className={fr.cx("fr-mb-4v")}>
            <DiagnosticNoiseScore
              score={diagnostic.score}
              db={diagnostic.max_db_lden}
              disabled={diagnostic.flags.hasNoisemapWarning}
            />
          </div>
          {diagnostic.equivalent_ambiences.length > 0 && (
            <>
              <p className={cx(fr.cx("fr-mb-2v"))}>
                Niveaux sonores équivalents :
              </p>
              <div>
                {diagnostic.equivalent_ambiences.map((ambience) => (
                  <Tag
                    key={ambience}
                    className={cx(
                      classes.ambienceTag,
                      fr.cx("fr-mr-2v", "fr-mb-2v"),
                    )}
                  >
                    {ambience}
                  </Tag>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const useStyles = tss
  .withParams<{
    score: number;
  }>()
  .create(({ score }) => ({
    container: {
      backgroundColor: fr.colors.decisions.background.contrast.grey.default,
      padding: fr.spacing("6v"),
      marginBottom: fr.spacing("6v"),
    },
    titleIcon: {
      color: fr.colors.decisions.background.flat.blueFrance.default,
    },
    ambienceTag: {
      backgroundColor: getColorFromScore(score),
    },
    summary: {
      ...fr.typography[21].style,
      p: {
        marginBottom: fr.spacing("2v"),
      },
    },
  }));

export default DiagnosticHero;
