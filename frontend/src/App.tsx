import { useState } from "react";
import MapComponent from "./components/map/MapComponent";
import { DiagnosticItem } from "./utils/types";
import { Header } from "@codegouvfr/react-dsfr/Header";
import Diagnostic from "./components/diagnostic/Diagnostic";

function App() {
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
      <Header
        brandTop={<>DiagBruit</>}
        homeLinkProps={{
          href: "/",
          title:
            "Accueil - DiagBruit (ministère, secrétariat d‘état, gouvernement)",
        }}
        id="fr-header-simple-header"
      />
      <div className="fr-container">
        <MapComponent
          onDiagnosticsChange={onDiagnosticsChange}
          onLoading={onLoading}
        />
        {diagnosticsResponses && diagnosticsResponses[0] && (
          <Diagnostic diagnostic={diagnosticsResponses[0]} isLoading={false} />
        )}
      </div>
    </div>
  );
}

export default App;
