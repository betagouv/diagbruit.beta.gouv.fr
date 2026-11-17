import { fr } from "@codegouvfr/react-dsfr";
import type React from "react";
import { tss } from "tss-react/dsfr";
import DiagnosticIsolationBadge from "./DiagnosticIsolationBadge";
import { useGoToTab } from "../../hooks/useGoToTab";

type DiagnosticIsolationRangeProps = {
  isolation_min: number | null;
  isolation_max: number | null;
};

const DiagnosticIsolationRange: React.FC<DiagnosticIsolationRangeProps> = ({
  isolation_min,
  isolation_max,
}) => {
  const { cx, classes } = useStyles();

  const goToTab = useGoToTab();

  return (
    <div>
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
            title="Isolement préconisé"
            isolation={isolation_min || 30}
          />

          <p className={fr.cx("fr-mb-2v", "fr-mt-4v")}>
            Pour un bâti à l’emplacement <strong>le moins protégé</strong> du
            bruit :
          </p>
          <DiagnosticIsolationBadge
            title="Isolement préconisé"
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
        <button
          type="button"
          className={cx(classes.fakeLink, fr.cx("fr-mb-0"))}
          onClick={() => goToTab("recommendations")}
        >
          Voir la documentation d'isolation
        </button>
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  fakeLink: {
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    ":hover": {
      backgroundColor: "white",
      backgroundImage: "none",
      "--hover-tint": "transparent",
    },
  },
}));

export default DiagnosticIsolationRange;
