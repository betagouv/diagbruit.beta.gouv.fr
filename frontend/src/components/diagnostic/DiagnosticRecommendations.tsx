import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Badge from "@codegouvfr/react-dsfr/Badge";
import DiagnosticParcelleSvg from "./DiagnosticParcelleSvg";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: { recommendations, land_intersections_ld, air_intersections },
    parcelle: { geometry },
  } = diagnosticItem;

  const uniqueSourceCodeInfraCombinations = new Set(
    land_intersections_ld.map(
      (item) => `${item.typesource}|||${item.codeinfra}`
    )
  );
  const isDiagnosticMonoSource =
    uniqueSourceCodeInfraCombinations.size + air_intersections.length === 1;

  return (
    <div>
      <div className={cx(classes.container)}>
        {isDiagnosticMonoSource && (
          <div className={fr.cx("fr-mb-10v")}>
            <div className={cx(classes.section)}>
              <p className={fr.cx("fr-mb-0")}>
                La parcelle n'est soumise qu'à une seule source de bruit
                terrestre, voici une estimation de l'impact du bruit sur la
                parcelle :
              </p>
              <div className={cx(classes.svgContainer)}>
                <DiagnosticParcelleSvg
                  geometry={geometry}
                  intersections={land_intersections_ld}
                />
              </div>
            </div>
          </div>
        )}
        <div className={cx(classes.section)}>
          <p className={fr.cx("fr-mb-0")}>
            Des exemples de préconisations sont consultables sur les thématiques
            suivantes :
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
              {recommendation.categories.map((category) => (
                <Tag
                  key={category.title}
                  className={fr.cx("fr-mb-4v", "fr-mr-2v")}
                >
                  {category.title}
                </Tag>
              ))}
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
  );
};

const useStyles = tss.create(() => ({
  container: {
    flexGrow: 1,
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
  mainIcon: {
    padding: fr.spacing("1v"),
  },
  svgContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "300px",
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v"
    )} ${fr.spacing("10v")}`,
    marginLeft: fr.spacing("6v"),
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
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
