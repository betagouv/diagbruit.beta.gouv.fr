import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import {
  getColorFromScore,
  getSummaryTextFromDiagnostic,
} from "../../utils/tools";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";
import DiagnosticTag from "./DiagnosticTag";
import DiagnosticScoreOnScale from "./DiagnosticScoreOnScale";

type DiagnosticDetailsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticDetails = ({
  diagnosticItem,
}: DiagnosticDetailsProps) => {
  const { diagnostic } = diagnosticItem;

  const { cx, classes } = useStyles({ score: diagnostic.score });

  return (
    <div className={cx(classes.container)}>
      <div className={cx("fr-col-12", "fr-grid-row")}>
        <h2>Parcelle n°{diagnosticItem.parcelle.numero}</h2>
        <div className={cx(classes.noiseScoreContainer, "fr-col-12", "fr-col-md-3")}>
          <DiagnosticNoiseScore
            score={diagnostic.score}
            db={diagnostic.max_db_lden}
            disabled={diagnostic.flags.hasNoisemapWarning}
          />
        </div>
      </div>

      {!diagnostic.flags.hasNoisemapWarning && (
        <DiagnosticScoreOnScale
          score={diagnostic.score}
          db={diagnostic.max_db_lden}
          light
        />
      )}
      <div
        className={classes.summary}
        dangerouslySetInnerHTML={{
          __html: getSummaryTextFromDiagnostic(diagnostic),
        }}
      />
      {diagnosticItem.diagnostic.equivalent_ambiences.length > 0 && (
        <div className={fr.cx("fr-grid-row")}>
          <strong className={cx(classes.title)}>
            Niveaux sonores équivalents :
          </strong>
          <div className={cx()}>
            {diagnostic.equivalent_ambiences.map((ambience) => (
              <DiagnosticTag
                key={ambience}
                ambience={ambience}
                className={cx(classes.ambienceTag)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const useStyles = tss
  .withParams<{
    score: number;
  }>()
  .create(({ score }) => ({
    container: {
      padding: fr.spacing("8v"),
      backgroundColor: fr.colors.decisions.background.contrast.grey.default,
    },
    noiseScoreContainer: {
      marginLeft: "auto",
      marginBottom: fr.spacing("8v")
    },
    title: {
      display: "flex",
      alignItems: "center",
      marginRight: fr.spacing("2v")
    },
    ambienceTag: {
      backgroundColor: getColorFromScore(score),
      marginTop: fr.spacing("2v"),
      marginRight: fr.spacing("2v"),
      [fr.breakpoints.up("md")]: {
        marginTop: 0,
      },
    },
    summary: {
      ...fr.typography[21].style,
      p: {
        marginBottom: fr.spacing("2v"),
      },
    },
  }));

export default DiagnosticDetails;
