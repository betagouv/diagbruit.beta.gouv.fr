import { useState } from "react";
import MapComponent from "./components/map/MapComponent";
import { DiagnosticItem } from "./utils/types";
import { Header } from "@codegouvfr/react-dsfr/Header";
import Diagnostic from "./components/diagnostic/Diagnostic";
import { Loader } from "./components/ui/Loader";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

function App() {
  const { cx, classes } = useStyles();

  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticsResponses, setDiagnosticsResponses] = useState<
    DiagnosticItem[]
  >([]);

  const onLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const onDiagnosticsChange = (newDiagnostics: DiagnosticItem[]) => {
    setDiagnosticsResponses(newDiagnostics);
  };

  return (
    <div>
      {isLoading && (
        <div className={cx(classes.loaderContainer)}>
          <Loader text="Nous générons votre diagnostic..." />
        </div>
      )}
      <Header
        brandTop={<>DiagBruit</>}
        homeLinkProps={{
          href: "/",
          title:
            "Accueil - DiagBruit (ministère, secrétariat d‘état, gouvernement)",
        }}
        id="fr-header-simple-header"
      />
      <div className={fr.cx("fr-container", "fr-py-10v")}>
        <h1>Votre diagnostic</h1>
        <MapComponent
          onDiagnosticsChange={onDiagnosticsChange}
          onLoading={onLoading}
        />
        {diagnosticsResponses && diagnosticsResponses[0] && (
          <Diagnostic
            diagnosticItem={diagnosticsResponses[0]}
            isLoading={false}
          />
        )}
      </div>
    </div>
  );
}

const useStyles = tss.withName(App.name).create(() => ({
  loaderContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    display: "flex",
    position: "fixed",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    zIndex: 9999,
  },
}));

export default App;
