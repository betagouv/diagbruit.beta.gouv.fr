import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
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
    <div className={cx(fr.cx("fr-grid-row"), classes.container)}>
      {isolation_min !== isolation_max ? (
        <>
          <DiagnosticIsolationBadge
            title="Isolement minimal"
            isolation={isolation_min || 30}
          />
          <i className={fr.cx("ri-arrow-right-line")} />
          <DiagnosticIsolationBadge
            title="Isolement maximal"
            isolation={isolation_max || 30}
          />
        </>
      ) : (
        <DiagnosticIsolationBadge isolation={isolation_min || 30} />
      )}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    gap: fr.spacing("4v"),
    alignItems: "center",
  },
}));

export default DiagnosticIsolationRange;
