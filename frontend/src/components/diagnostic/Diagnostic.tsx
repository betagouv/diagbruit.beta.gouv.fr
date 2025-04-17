import { DiagnosticItem } from "../../utils/types";

type DiagnosticProps = {
  diagnostic: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnostic }: DiagnosticProps) => {
  return (
    <div>
      <h1>Diagnostic Component</h1>
      <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
    </div>
  );
};

export default Diagnostic;
