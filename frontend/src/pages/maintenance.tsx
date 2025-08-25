import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

function MaintenancePage() {
  const { classes, cx } = useStyles();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={cx(classes.container)}>
      <h1 className={fr.cx("fr-mb-2v")}>
        diagBruit est temporairement indisponible
      </h1>

      <Alert
        severity="info"
        title="Notre équipe travaille à une mise à jour"
        description={
          <>
            Nous procédons actuellement à une opération de maintenance
            <br /> afin d’améliorer l’outil et garantir une meilleure qualité de
            service.
          </>
        }
        className={fr.cx("fr-my-8v")}
      />

      <p className={fr.cx("fr-text--lg", "fr-mb-6v")}>
        Le service sera de nouveau accessible très prochainement.
        <br /> Nous vous invitons à réessayer un peu plus tard.
      </p>

      <Button
        priority="secondary"
        iconId="ri-refresh-line"
        onClick={handleRefresh}
      >
        Actualiser la page
      </Button>
    </div>
  );
}

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: fr.spacing("10v"),
  },
}));

export default MaintenancePage;
