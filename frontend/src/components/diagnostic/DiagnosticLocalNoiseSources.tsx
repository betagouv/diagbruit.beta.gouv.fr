import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useMemo, useState } from "react";
import { tss } from "tss-react/dsfr";
import { getIconFromNoiseCategorySlug } from "../../utils/tools";
import type {
  DiagnosticItem,
  NoiseSourceIntersection,
} from "../../utils/types";
import NoiseSourcesModal, {
  modal,
  type SelectedCategory,
} from "./NoiseSourcesModal";

interface DiagnosticLocalNoiseSourcesProps {
  diagnosticItem: DiagnosticItem;
}

export default function DiagnosticLocalNoiseSources({
  diagnosticItem,
}: DiagnosticLocalNoiseSourcesProps) {
  const { classes, cx } = useStyles();
  const { noisesource_intersections } = diagnosticItem.diagnostic;
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory | null>(null);

  const handleCategoryClick = (
    categoryName: string,
    categorySlug: string,
    sources: NoiseSourceIntersection[],
  ) => {
    setSelectedCategory({ categoryName, categorySlug, sources });
    modal.open();
  };

  if (!noisesource_intersections || noisesource_intersections.length === 0) {
    return (
      <div className={classes.container}>
        <h4 className={cx(classes.title, fr.cx("fr-h6", "fr-mb-2v"))}>
          Aucune information pour le moment
        </h4>
        <p className={fr.cx("fr-mb-0")}>
          À ce jour, aucune source de nuisance sonore n'a été identifiée à
          proximité de votre parcelle. Cela n'exclut pas l'existence de
          nuisances non référencées. Une visite sur place reste le meilleur
          moyen de vous faire votre propre avis.
        </p>
      </div>
    );
  }

  const noisesourcesGrouped = useMemo(() => {
    return Object.entries(
      noisesource_intersections.reduce(
        (acc, source) => {
          if (!acc[source.category_slug]) {
            acc[source.category_slug] = {
              category_name: source.category_name,
              category_description: source.category_description,
              sources: [],
            };
          }
          acc[source.category_slug].sources.push(source);
          return acc;
        },
        {} as Record<
          string,
          {
            category_name: string;
            category_description: string;
            sources: NoiseSourceIntersection[];
          }
        >,
      ),
    );
  }, [noisesource_intersections]);

  return (
    <>
      <div className={classes.container}>
        <h4 className={cx(classes.title, fr.cx("fr-h6", "fr-mb-4v"))}>
          Établissements et équipements sonores à proximité
        </h4>
        <div className={classes.buttonContainer}>
          {noisesourcesGrouped.map(([categorySlug, group]) => (
            <Button
              key={categorySlug}
              size="small"
              className={classes.categoryButton}
              onClick={() =>
                handleCategoryClick(
                  group.category_name,
                  categorySlug,
                  group.sources,
                )
              }
            >
              <i
                className={cx(
                  fr.cx(getIconFromNoiseCategorySlug(categorySlug)),
                  classes.groupIcon,
                )}
              />{" "}
              Liste des {group.category_name.toLocaleLowerCase()} (
              {group.sources.length})
            </Button>
          ))}
        </div>
        <p>
          Ces établissements et équipements, situés à proximité de votre
          parcelle, peuvent générer une gêne sonore. Nous vous recommandons de
          vous rendre sur place afin d'évaluer la situation selon vos propres
          usages et sensibilités.
        </p>
        {noisesourcesGrouped.map(([, group]) => (
          <p>{group.category_description}</p>
        ))}
      </div>

      <NoiseSourcesModal selectedCategory={selectedCategory} />
    </>
  );
}

const useStyles = tss.withName(DiagnosticLocalNoiseSources.name).create({
  container: {
    marginTop: fr.spacing("4v"),
    background: fr.colors.decisions.background.default.grey.active,
    padding: fr.spacing("4v"),
    ul: {
      marginLeft: fr.spacing("4v"),
    },
    p: {
      "&:last-of-type": {
        marginBottom: 0,
      },
    },
  },
  title: {
    fontSize: fr.typography[19].style.fontSize,
  },
  buttonContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: fr.spacing("2v"),
    marginBottom: fr.spacing("4v"),
  },
  categoryButton: {
    marginBottom: 0,
  },
  groupIcon: {
    "&::before": {
      "--icon-size": "1rem",
      marginRight: fr.spacing("2v"),
    },
  },
});
