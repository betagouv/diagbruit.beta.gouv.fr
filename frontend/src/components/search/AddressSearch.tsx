import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import { getReadbleGeoGouvType } from "../../utils/tools";
import Button from "@codegouvfr/react-dsfr/Button";

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
    }: AddressSearchProps,
    ref: React.Ref<{ reset: () => void }>
  ) => {
    const { cx, classes } = useStyles();
    const [inputValue, setInputValue] = useState("");
    const [valueSelected, setValueSelected] = useState<AddressFeature | null>(
      null
    );
    const { options, loading, fetchAddresses } = useAddressSearch(limit);

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
            className={fr.cx("fr-px-8v")}
            type="submit"
            disabled={!valueSelected}
          >
            Rechercher
          </Button>
        </form>
      </div>
    );
  }
);

const useStyles = tss.withName(AddressSearch.name).create(() => ({
  container: {
    form: {
      display: "flex",
      gap: fr.spacing("2v"),
    },
  },
  autocomplete: {
    flexGrow: 1,
    ".MuiInputBase-root": {
      backgroundColor: fr.colors.decisions.background.disabled.grey.default,
      border: 0,
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
