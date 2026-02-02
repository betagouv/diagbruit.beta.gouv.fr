import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { tss } from "tss-react/dsfr";
import {
  getColorFromScore,
  getSummaryTextFromDiagnostic,
} from "../../utils/tools";
import { trackMatomoEvent } from "../../utils/matomo";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";

type DiagnosticHeroProps = {
  diagnosticItem: DiagnosticItem;
  handleCopyUrl?: (title?: string) => void;
};

const DiagnosticHero = ({
  diagnosticItem,
  handleCopyUrl,
}: DiagnosticHeroProps) => {
  const { diagnostic } = diagnosticItem;

  const { cx, classes } = useStyles({ score: diagnostic.score });

  const handleContactClick = () => {
    trackMatomoEvent(
      "Diagnostic",
      "Contact",
      `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`
    );
  };

  return (
    <div className={cx(classes.container)}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <div className={fr.cx("fr-mb-4v")}>
            <DiagnosticNoiseScore
              score={diagnostic.score}
              db={diagnostic.max_db_lden}
              disabled={diagnostic.flags.hasNoisemapWarning}
            />
          </div>
          {diagnostic.equivalent_ambiences.length > 0 && (
            <>
              <p className={cx(classes.subTitle, fr.cx("fr-mb-2v"))}>
                Niveaux sonores équivalents
              </p>
              <div>
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
              </div>
            </>
          )}
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          <h4 className={fr.cx("fr-h6", "fr-mb-4v")}>
            <i
              className={cx(classes.titleIcon, fr.cx("ri-information-fill"))}
            />{" "}
            Résumé du diagnostic
          </h4>
          <div
            className={classes.summary}
            dangerouslySetInnerHTML={{
              __html: getSummaryTextFromDiagnostic(diagnostic),
            }}
          />
          <div className={cx(classes.contactButtonsContainer)}>
            <Button
              priority="secondary"
              iconId="ri-mail-line"
              className={cx(classes.contactButton)}
              linkProps={{
                href: `mailto:${process.env.REACT_APP_CONTACT_EMAIL}`,
                onClick: handleContactClick,
              }}
            >
              Contacter l'équipe diagBruit
            </Button>
          </div>
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
    subTitle: {
      fontWeight: "bold",
    },
    ambienceTag: {
      backgroundColor: getColorFromScore(score),
    },
    summary: {
      p: {
        marginBottom: fr.spacing("2v"),
      },
    },
    contactButtonsContainer: {
      display: "flex",
      justifyContent: "end",
      gap: fr.spacing("2v"),
      marginTop: fr.spacing("4v"),
    },
    contactButton: {
      justifyContent: "center",
    },
  }));

export default DiagnosticHero;
