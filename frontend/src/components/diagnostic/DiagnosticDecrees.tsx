import { fr } from "@codegouvfr/react-dsfr";
import { useEffect, useState } from "react";
import axios from "axios";
import { Decree, DiagnosticItem } from "../../utils/types";

type DiagnosticDecreesProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticDecrees = ({ diagnosticItem }: DiagnosticDecreesProps) => {
  const [decrees, setDecrees] = useState<Decree[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    parcelle: { code_insee },
  } = diagnosticItem;

  const codedept = parseInt(code_insee.substring(0, 2));

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/decrees`, {
        params: {
          filters: {
            codedept: {
              $eq: codedept,
            },
          },
        },
      })
      .then((res) => {
        setDecrees(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [codedept]);

  if (isLoading) {
    return <></>;
  }

  return (
    <p className={fr.cx("fr-mb-0")}>
      Références :{" "}
      <a
        href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837"
        target="_blank"
      >
        Arrêté du 30 mai 1996
      </a>{" "}
      |{" "}
      <a
        href="https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290"
        target="_blank"
      >
        Arrêté du 23 juillet 2013
      </a>{" "}
      |{" "}
      <a
        href="https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf;jsessionid=7E0C81517851C74F3F89CE11CC665533"
        target="_blank"
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
