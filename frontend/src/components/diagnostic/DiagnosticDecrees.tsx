import { fr } from "@codegouvfr/react-dsfr";

const DiagnosticDecrees = () => {
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
    </p>
  );
};

export default DiagnosticDecrees;
