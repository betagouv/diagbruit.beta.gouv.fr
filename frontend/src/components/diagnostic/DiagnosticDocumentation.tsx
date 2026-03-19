import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Tag from "@codegouvfr/react-dsfr/Tag";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { getRecommendationsFilterConditionsFromDiagnostic } from "../../utils/tools";
import type { DiagnosticItem, Recommendation } from "../../utils/types";

type DiagnosticHeroProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticDocumentation = ({ diagnosticItem }: DiagnosticHeroProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: { isolation_min, isolation_max },
  } = diagnosticItem;

  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
        params: {
          populate: "*",
          filters:
            getRecommendationsFilterConditionsFromDiagnostic(diagnosticItem),
        },
      })
      .then((res) => {
        setRecommendations(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error(err);
      });
  }, []);

  const computedCommonRecommendations = recommendations.filter(
    (recommendation) => !recommendation.isolation
  );

  const computedIsolationRecommendations = recommendations
    .filter((recommendation) => !!recommendation.isolation)
    .sort(
      (a, b) =>
        (b.conditions.isolation_lte || 0) - (a.conditions.isolation_gte || 0)
    );

  return (
    <div className={cx(classes.container)}>
      <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-10v")}>
        Documentation d'isolation
      </h4>
      <div className={cx(classes.section)}>
        <p className={fr.cx("fr-mb-0")}>
          Voici les recommandations pour atteindre une isolation acoustique
          comprise entre <strong>{isolation_min}db</strong> et{" "}
          <strong>{isolation_max}db</strong>.
        </p>
      </div>
      {!!computedIsolationRecommendations.length && (
        <div
          className={cx(
            classes.accordions,
            fr.cx("fr-accordions-group", "fr-mt-8v")
          )}
        >
          {computedIsolationRecommendations.map((recommendation, index) => (
            <Accordion key={index} label={recommendation.title} titleAs="h5">
              {recommendation.categories.map((category) => (
                <Tag
                  key={category.title}
                  className={fr.cx("fr-mb-4v", "fr-mr-2v")}
                >
                  {category.title}
                </Tag>
              ))}
              <div
                className={cx(classes.recommendationContent)}
                dangerouslySetInnerHTML={{ __html: recommendation.content }}
              />
              {!!recommendation.links.length && (
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
      )}
      <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-10v")}>
        Médiathèque
      </h4>
      <div className={cx(classes.section)}>
        <p className={fr.cx("fr-mb-0")}>
          Cette médiathèque de préconisations est actuellement en cours de
          développement et d'implémentation. Elle sera progressivement enrichie
          avec de nouveaux contenus, optimisée au fil du temps pour vous offrir
          des ressources plus pertinentes et complètes.
        </p>
      </div>
      {!!computedCommonRecommendations.length && (
        <div
          className={cx(
            classes.accordions,
            fr.cx("fr-accordions-group", "fr-mt-8v")
          )}
        >
          {computedCommonRecommendations.map((recommendation, index) => (
            <Accordion key={index} label={recommendation.title} titleAs="h5">
              {recommendation.categories.map((category) => (
                <Tag
                  key={category.title}
                  className={fr.cx("fr-mb-4v", "fr-mr-2v")}
                >
                  {category.title}
                </Tag>
              ))}
              <div
                className={cx(classes.recommendationContent)}
                dangerouslySetInnerHTML={{ __html: recommendation.content }}
              />
              {!!recommendation.links.length && (
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
      )}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {},
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
  recommendationContent: {
    img: {
      height: "auto",
      aspectRatio: "auto",
    },
  },
}));

export default DiagnosticDocumentation;
