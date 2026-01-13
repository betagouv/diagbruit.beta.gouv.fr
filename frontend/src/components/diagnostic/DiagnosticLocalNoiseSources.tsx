import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";

interface DiagnosticLocalNoiseSourcesProps {
  diagnosticItem: DiagnosticItem;
}

export default function DiagnosticLocalNoiseSources({
  diagnosticItem,
}: DiagnosticLocalNoiseSourcesProps) {
  const { classes, cx } = useStyles();
  const { noisesource_intersections } = diagnosticItem.diagnostic;

  if (!noisesource_intersections || noisesource_intersections.length === 0) {
    return (
      <div className={classes.container}>
        <h4 className={cx(classes.title, fr.cx("fr-h6"))}>
          Aucune information pour le moment
        </h4>
        <p className={fr.cx("fr-mb-0")}>
          À ce jour, aucune source de nuisance sonore n’a été identifiée à
          proximité de votre parcelle. Cela n’exclut pas l’existence de
          nuisances non référencées. Une visite sur place reste le meilleur
          moyen de vous faire votre propre avis.
        </p>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <h4 className={cx(classes.title, fr.cx("fr-h6"))}>
        Établissements et équipements sonores à proximité
      </h4>
      <div className={classes.buttonContainer}>
        {Object.entries(
          noisesource_intersections.reduce((acc, source) => {
            if (!acc[source.category_slug]) {
              acc[source.category_slug] = {
                category_name: source.category_name,
                count: 0,
              };
            }
            acc[source.category_slug].count++;
            return acc;
          }, {} as Record<string, { category_name: string; count: number }>)
        ).map(([categorySlug, group]) => (
          <Button
            key={categorySlug}
            priority="secondary"
            size="small"
            className={classes.categoryButton}
          >
            {group.category_name} ({group.count})
          </Button>
        ))}
      </div>
      <p className={fr.cx("fr-mb-0")}>
        Ces établissements et équipements, situés à proximité de votre parcelle,
        peuvent générer une gêne sonore, notamment la nuit lorsque le niveau de
        bruit ambiant diminue. Nous vous recommandons de vous rendre sur place
        afin d’évaluer la situation selon vos propres usages et sensibilités.
      </p>
    </div>
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
});
