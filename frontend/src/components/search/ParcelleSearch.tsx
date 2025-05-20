import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

const parcelleSchema = z.object({
  codeInsee: z.string().regex(/^\d{5}$/, "Code INSEE (5 chiffres)"),
  prefix: z.string().regex(/^\d{3}$/, "Préfixe (3 chiffres)"),
  section: z
    .string()
    .regex(
      /^[A-Z0-9]{2}$/,
      "Section (2 caractères : lettres majuscules et/ou chiffres)"
    ),
  numero: z.string().regex(/^\d{4}$/, "Numéro (4 chiffres)"),
});

type ParcelleFormData = z.infer<typeof parcelleSchema>;

interface ParcelleSearchProps {
  onParcelleRequested: (
    response: { data?: any; error?: any },
    values: ParcelleFormData
  ) => void;
  onChange?: () => void;
  formValues?: ParcelleFormData;
}

const ParcelleSearch = ({
  onParcelleRequested,
  onChange,
  formValues,
}: ParcelleSearchProps) => {
  const { cx, classes } = useStyles();

  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<ParcelleFormData>({
    resolver: zodResolver(parcelleSchema),
    mode: "all",
    defaultValues: formValues,
  });

  const onSubmit = async (data: ParcelleFormData) => {
    const { codeInsee, section, numero, prefix } = data;
    const url = `https://apicarto.ign.fr/api/cadastre/parcelle?${
      prefix !== "000" ? `com_abs=${prefix}` : `code_insee=${codeInsee}`
    }&section=${section}&numero=${numero}`;

    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const responseData = await response.json();
      onParcelleRequested({ data: responseData }, data);
    } catch (error) {
      onParcelleRequested({ error }, data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (formValues) {
      Object.entries(formValues).forEach(([key, value]) => {
        setValue(key as keyof ParcelleFormData, value);
      });
    }
    trigger();
  }, [formValues, setValue, trigger]);

  return (
    <div className={cx(classes.container)}>
      <form onSubmit={handleSubmit(onSubmit)} onChange={onChange}>
        {Object.entries(fieldsConfig).map(([name, config]) => (
          <Controller
            key={name}
            name={name as keyof ParcelleFormData}
            control={control}
            render={({ field }) => (
              <Input
                label={config.label}
                state={
                  errors[name as keyof ParcelleFormData] ? "info" : "success"
                }
                hintText={config.hintText}
                stateRelatedMessage={config.patternText}
                nativeInputProps={{
                  ...field,
                  ...config.nativeInputProps,
                }}
              />
            )}
          />
        ))}

        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading ? (
            <i className={fr.cx("ri-loader-4-line")} />
          ) : (
            "Rechercher"
          )}
        </Button>
      </form>
    </div>
  );
};

const fieldsConfig: Record<
  string,
  {
    label: string;
    hintText: string;
    patternText: string;
    nativeInputProps: Partial<React.InputHTMLAttributes<HTMLInputElement>>;
  }
> = {
  codeInsee: {
    label: "Code INSEE",
    hintText: "Saisissez le code INSEE de la commune",
    patternText: "Exemple : 44000, 75001",
    nativeInputProps: {
      inputMode: "numeric",
      pattern: "\\d{5}",
      type: "text",
    },
  },
  prefix: {
    label: "Préfixe",
    patternText: "Exemple : 000, 001",
    hintText: "Saisissez les références de préfixe",
    nativeInputProps: {
      pattern: "\\d{3}",
      type: "text",
    },
  },
  section: {
    label: "Numéro de section",
    patternText: "Saisir une référence : AO, AA...",
    hintText: "Saisissez les références de section",
    nativeInputProps: {
      pattern: "[A-Z0-9]{2}",
      type: "text",
    },
  },
  numero: {
    label: "Numéro de parcelle",
    hintText: "Saisissez les références de parcelle",
    patternText: "Exemple : 0545, 01",
    nativeInputProps: {
      inputMode: "numeric",
      pattern: "\\d{4}",
      type: "text",
    },
  },
};

const useStyles = tss.create(() => ({
  container: {
    form: {
      display: "flex",
      flexDirection: "row",
      gap: fr.spacing("6v"),
      alignItems: "center",
      button: {
        marginBottom: fr.spacing("1v"),
        flexGrow: 1,
        justifyContent: "center",
        i: {
          display: "inline-block",
          animation: "spin 1s linear infinite",
        },
      },
      ".fr-input-group": {
        "&::before": {
          backgroundImage: "none",
        },
        ".fr-label": {
          color: `${fr.colors.decisions.text.actionHigh.grey.default} !important`,
        },
      },
      [fr.breakpoints.down("md")]: {
        flexDirection: "column",
        alignItems: "start",
        gap: 0,
        button: {
          width: "100%",
          marginBottom: fr.spacing("6v"),
        },
        ".fr-input-group": {
          width: "100%",
        },
      },
    },
  },
}));

export default ParcelleSearch;
