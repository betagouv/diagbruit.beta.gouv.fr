import { fr } from "@codegouvfr/react-dsfr";
import useDecrees from "../../hooks/useDecrees";
import type { DiagnosticItem } from "../../utils/types";
import { Loader } from "../ui/Loader";

type DiagnosticDecreesProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticDecrees = ({ diagnosticItem }: DiagnosticDecreesProps) => {
  const {
    parcelle: { code_insee },
  } = diagnosticItem;

  const codedept = parseInt(code_insee.substring(0, 2), 10);
  const { decrees, isLoading } = useDecrees(codedept);

  if (isLoading) {
    return <Loader text="Chargement des arrêtés préfectoraux locaux..." />;
  }

  return (
    <p className={fr.cx("fr-mb-0")}>
      Références :{" "}
      <a
        href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837"
        target="_blank" rel="noopener"
      >
        Arrêté du 30 mai 1996
      </a>{" "}
      |{" "}
      <a
        href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290"
        target="_blank" rel="noopener"
      >
        Arrêté du 23 juillet 2013
      </a>{" "}
      |{" "}
      <a
        href="https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf;jsessionid=7E0C81517851C74F3F89CE11CC665533"
        target="_blank" rel="noopener"
      >
        Arrêté du 3 septembre 2013
      </a>
      {decrees.map((decree) => (
        <span key={decree.id}>
          {" "}
          |{" "}
          <a href={decree.link} target="_blank">
            Arrêté Préfectoral local
          </a>
        </span>
      ))}
    </p>
  );
};

export default DiagnosticDecrees;
