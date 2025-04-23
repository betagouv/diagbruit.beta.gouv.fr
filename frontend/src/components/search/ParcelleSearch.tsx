import { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { tss } from "tss-react/dsfr";

type ParcelleSearchProps = {
  onParcelleRequested: (response: { data?: any; error?: any }) => void;
  formValues: {
    codeInsee: string;
    section: string;
    numero: string;
  };
};

const ParcelleSearch = ({
  onParcelleRequested,
  formValues,
}: ParcelleSearchProps) => {
  const { cx, classes } = useStyles();

  const [codeInsee, setCodeInsee] = useState("");
  const [section, setSection] = useState("");
  const [numero, setNumero] = useState("");

  const canSearch = !!codeInsee && !!section && !!numero;

  const handleSearch = async () => {
    const url = `https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=${codeInsee}&section=${section}&numero=${numero}`;

    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      onParcelleRequested({ data });
    } catch (error) {
      onParcelleRequested({ error });
    }
  };

  useEffect(() => {
    setCodeInsee(formValues.codeInsee);
    setSection(formValues.section);
    setNumero(formValues.numero);
  }, [formValues]);

  return (
    <div className={cx(classes.container)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Input
          label="Code insee commune"
          state="default"
          stateRelatedMessage="Texte d’erreur obligatoire"
          nativeInputProps={{
            inputMode: "numeric",
            pattern: "[0-9]{5}",
            type: "number",
            value: codeInsee,
            onChange: (e) => setCodeInsee(e.target.value),
          }}
        />
        <Input
          label="Section"
          state="default"
          nativeInputProps={{
            pattern: "[A-Z]{2}",
            value: section,
            onChange: (e) => setSection(e.target.value.toUpperCase()),
          }}
        />
        <Input
          label="Numéro de parcelle"
          state="default"
          nativeInputProps={{
            inputMode: "numeric",
            pattern: "[0-9]{4}",
            type: "number",
            value: numero,
            onChange: (e) => setNumero(e.target.value),
          }}
        />
        <Button type={"submit"} disabled={!canSearch}>
          Rechercher
        </Button>
      </form>
    </div>
  );
};

const useStyles = tss.withName(ParcelleSearch.name).create(() => ({
  container: {
    form: {
      display: "flex",
      flexDirection: "row",
      gap: fr.spacing("6v"),
      button: {
        alignSelf: "flex-end",
        marginBottom: fr.spacing("6v"),
      },
    },
  },
}));

export default ParcelleSearch;
