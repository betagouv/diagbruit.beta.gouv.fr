import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { useSearchParams } from "react-router-dom";
import DiagnosticIsolationBadge from "./DiagnosticIsolationBadge";

type DiagnosticIsolationRangeProps = {
  isolation_min: number | null;
  isolation_max: number | null;
};

const DiagnosticIsolationRange: React.FC<DiagnosticIsolationRangeProps> = ({
  isolation_min,
  isolation_max,
}) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      {isolation_min !== isolation_max ? (
        <div>
          <p className={fr.cx("fr-mb-2v")}>
            L’isolement à mettre en oeuvre dépend de la position du bâti sur la
            parcelle.
          </p>
          <p className={fr.cx("fr-mb-2v")}>
            Pour un bâti à l’emplacement <strong>le plus protégé</strong> du
            bruit :
          </p>
          <DiagnosticIsolationBadge
            title="Isolement préconnisé"
            isolation={isolation_min || 30}
          />

          <p className={fr.cx("fr-mb-2v", "fr-mt-4v")}>
            Pour un bâti à l’emplacement <strong>le moins protégé</strong> du
            bruit :
          </p>
          <DiagnosticIsolationBadge
            title="Isolement préconnisé"
            isolation={isolation_max || 30}
          />
        </div>
      ) : (
        <div>
          <p className={fr.cx("fr-mb-2v")}>
            L'isolement requis ne dépend pas de la position du bâti sur cette
            parcelle.
          </p>
          <DiagnosticIsolationBadge isolation={isolation_min || 30} />
        </div>
      )}
      <div className={fr.cx("fr-mt-4v")}>
        <a
          href="#diagnostic-section"
          onClick={() => {
            (
              document.querySelector(
                '[id^="tabpanel-"][id$="-3"]'
              ) as HTMLElement
            )?.click();
          }}
        >
          Voir la documentation d'isolation
        </a>
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {},
}));

export default DiagnosticIsolationRange;
