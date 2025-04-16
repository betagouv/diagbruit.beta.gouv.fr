import { useState } from "react";
import MapComponent from "./components/map/MapComponent";
import { DiagnosticItem } from "./utils/types";

function App() {
  const [diagnosticsResponses, setDiagnosticsResponses] = useState<any>(null);

  const onDiagnosticsChange = (newDiagnostics: DiagnosticItem[]) => {
    setDiagnosticsResponses(newDiagnostics);
  };

  console.log(diagnosticsResponses);

  return (
    <div>
      <MapComponent onDiagnosticsChange={onDiagnosticsChange} />
      {diagnosticsResponses && diagnosticsResponses[0] && (
        <div>
          <h2>Diagnostic</h2>
          <pre>{JSON.stringify(diagnosticsResponses[0], null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
