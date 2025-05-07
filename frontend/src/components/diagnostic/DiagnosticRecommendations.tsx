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
              <Accordion key={index} label={recommendation.title}>
                <Tag className={fr.cx("fr-mb-4v")}>
                  {recommendation.category}
                </Tag>
                <div
                  dangerouslySetInnerHTML={{ __html: recommendation.content }}
                />
                {recommendation.links.length && (
                  <div className={cx(classes.links)}>
                    <p className={fr.cx("fr-mb-2v")}>
                      <b>Liens utiles :</b>
                    </p>
                    <ul className={fr.cx("fr-mb-0")}>
                      {recommendation.links.map((link, index) => (
                        <li key={index}>
                          <a href={link.href} target="_blank">
                            {link.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
  links: {
    backgroundColor: fr.colors.decisions.background.default.grey.active,
    padding: fr.spacing("4v"),
    marginTop: fr.spacing("8v"),
    ul: {
      marginLeft: fr.spacing("4v"),
    },
  },
}));

export default DiagnosticRecommendations;
