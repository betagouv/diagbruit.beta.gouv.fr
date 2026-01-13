import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";

interface DiagnosticLocalNoiseSourcesProps {
  diagnosticItem: DiagnosticItem;
}

export default function DiagnosticLocalNoiseSources({
  diagnosticItem,
}: DiagnosticLocalNoiseSourcesProps) {
  const { classes } = useStyles();
  const { noisesource_intersections } = diagnosticItem.diagnostic;

  if (!noisesource_intersections || noisesource_intersections.length === 0) {
    return null;
  }

  return (
    <div className={classes.container}>
      <h4 className={fr.cx("fr-h6", "fr-mb-4v")}>
        ⚠️ Données locales remontées
      </h4>
      <ul className={fr.cx("fr-mb-0")}>
        {noisesource_intersections.map((source, index) => (
          <li key={index}>
            <strong>{source.category_name}</strong> : "{source.label}" situé à{" "}
            {source.distance}m
          </li>
        ))}
      </ul>
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
});
