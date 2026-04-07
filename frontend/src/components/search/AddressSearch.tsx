import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type React from "react";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { tss } from "tss-react/dsfr";
import { getReadbleGeoGouvType } from "../../utils/tools";

export type AddressFeature = {
  properties: {
    label: string;
    context: string;
    type: string;
  };
  geometry: {
    coordinates: number[];
  };
};

type AddressSearchProps = {
  className?: string;
  id: string;
  placeholder: string;
  onValueSelected?: (feature: AddressFeature) => void;
  limit?: number;
  defaultValue?: AddressFeature;
  lite?: boolean;
};

const useAddressSearch = (limit: number) => {
  const [options, setOptions] = useState<AddressFeature[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = async (query: string) => {
    if (query.length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          query
        )}&limit=${limit}`
      );
      const data = await response.json();
      setOptions(data.features || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  return { options, loading, fetchAddresses };
};

const renderAddressOption = (
  props: React.HTMLAttributes<HTMLLIElement>,
  option: AddressFeature
) => {
  const { label, context, type } = option.properties;

  return (
    <li {...props}>
      <div>
        <b>{label}</b>
        <br />
        <span>{context}</span>
      </div>
      <div>{getReadbleGeoGouvType(type)}</div>
    </li>
  );
};

const AddressSearch = forwardRef(
  (
    {
      className,
      id,
      placeholder,
      onValueSelected,
      limit = 5,
      defaultValue,
      lite = false,
    }: AddressSearchProps,
    ref: React.Ref<{ reset: () => void }>
  ) => {
    const { cx, classes } = useStyles();
    const [inputValue, setInputValue] = useState("");
    const [valueSelected, setValueSelected] = useState<AddressFeature | null>(
      null
    );
    const { options, fetchAddresses } = useAddressSearch(limit);

    const ignoreInputChange = useRef(false);

    useImperativeHandle(ref, () => ({
      reset() {
        setValueSelected(null);
        setInputValue("");
        ignoreInputChange.current = true;
      },
    }));

    useEffect(() => {
      if (defaultValue) {
        setInputValue(defaultValue.properties.label);
        setValueSelected(defaultValue);
        ignoreInputChange.current = true;
      }
    }, [defaultValue]);

    return (
      <div className={cx(classes.container, className)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onValueSelected && valueSelected) {
              onValueSelected(valueSelected);
            }
          }}
        >
          <Autocomplete
            className={cx(classes.autocomplete)}
            id={id}
            inputValue={inputValue}
            options={options}
            getOptionLabel={(option) => option.properties?.label || ""}
            filterOptions={(x) => x}
            noOptionsText="Aucun résultat"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "flip",
                    enabled: false,
                  },
                  {
                    name: "preventOverflow",
                    enabled: false,
                  },
                ],
              },
            }}
            onInputChange={(_, value) => {
              if (ignoreInputChange.current) {
                ignoreInputChange.current = false;
                return;
              }
              setValueSelected(null);
              setInputValue(value);
              fetchAddresses(value);
            }}
            onChange={(_, value) => {
              setValueSelected(value);
            }}
            renderOption={(props, option) =>
              renderAddressOption(
                { ...props, className: cx(classes.autocompleteOption) },
                option
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={placeholder}
                variant="outlined"
              />
            )}
          />
          <Button
            type="submit"
            disabled={!valueSelected}
            iconId="fr-icon-search-line"
            iconPosition="left"
            className={cx(classes.submitButton)}
          >
            {lite ? "" : "Lancer le diagnostic sonore"}
          </Button>
        </form>
      </div>
    );
  }
);

const useStyles = tss.create(() => ({
  container: {
    form: {
      display: "flex",
    },
    borderBottom: `2px solid ${fr.colors.decisions.background.flat.blueFrance.default}`,
  },
  submitButton: {
    display: "flex !important",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 !important",
    "&::before": {
      margin: "0 !important",
    },
    gap: fr.spacing("2v"),
  },
  autocomplete: {
    flexGrow: 1,
    ".MuiInputBase-root": {
      backgroundColor: fr.colors.decisions.background.disabled.grey.default,
      borderRadius: 0,
      paddingRight: `${fr.spacing("4v")} !important`,
      input: {
        padding: "0 !important",
      },
      fieldset: {
        border: 0,
      },
    },
    ".MuiAutocomplete-endAdornment": {
      display: "none",
    },
  },
  autocompleteOption: {
    padding: fr.spacing("3v"),
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("2v"),
    cursor: "pointer",

    "& > div:first-of-type": {
      flexGrow: 1,
    },
    "&:hover, &.Mui-focusVisible": {
      backgroundColor: fr.colors.decisions.background.flat.info.default,
      color: fr.colors.decisions.background.default.grey.default,
    },
  },
}));

export default memo(AddressSearch);
