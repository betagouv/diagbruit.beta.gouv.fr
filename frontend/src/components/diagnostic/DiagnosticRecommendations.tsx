import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Badge from "@codegouvfr/react-dsfr/Badge";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  console.log(DiagnosticRecommendations.name);

  const {
    diagnostic: { recommendations },
  } = diagnosticItem;

  return (
    <div>
      <div className={cx(classes.container)}>
        <div>
          <img
            className={cx(classes.mainIcon)}
            src="/images/innovation.svg"
            width={80}
            height={80}
          />
        </div>
        <div className={classes.content}>
          <h2 className={fr.cx("fr-h5")}>2. Préconisations</h2>
          <div className={cx(classes.section)}>
            <p className={fr.cx("fr-mb-0")}>
              Des exemples de préconisations sont consultables sur les
              thématiques suivantes :
            </p>
          </div>
          <div
            className={cx(
              classes.accordions,
              fr.cx("fr-accordions-group", "fr-mt-6v")
            )}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "end",
                marginTop: "-2rem",
              }}
            >
              <Badge className={fr.cx("fr-mb-2v")} severity="info">
                Work in progress
              </Badge>
            </div>
            {recommendations.map((recommendation, index) => (
              <Accordion
                key={index}
                label={
                  <>
                    <Tag className={fr.cx("fr-mr-2v")}>
                      {recommendation.category}
                    </Tag>{" "}
                    {recommendation.title}
                  </>
                }
              >
                <div
                  dangerouslySetInnerHTML={{ __html: recommendation.content }}
                />
                {recommendation.links.length && (
                  <p className={fr.cx("fr-mb-2v")}>Liens utiles :</p>
                )}
                {recommendation.links.map((link, index) => (
                  <div key={index}>
                    <a href={link.href} target="_blank">
                      {link.title}
                    </a>
                  </div>
                ))}
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    [fr.breakpoints.down("md")]: {
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
    flexGrow: 1,
    paddingTop: fr.spacing("11v"),
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
  accordions: {
    width: "100%",
  },
}));

export default DiagnosticRecommendations;
