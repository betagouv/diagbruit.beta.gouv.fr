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
    citycode?: string;
  };
  geometry: {
    coordinates: number[];
  };
};

type AddressSearchProps = {
  className?: string;
  id: string;
  placeholder: string;
  onValueSelected?: (feature: AddressFeature | null) => void;
  limit?: number;
  defaultValue?: AddressFeature;
  label?: string;
  light?: boolean;
  isMobile?: boolean;
};

const useAddressSearch = (limit: number) => {
  const [options, setOptions] = useState<AddressFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAddresses = (query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.length < 3) {
      setOptions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
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
    }, 100);
  };

  return { options, loading, fetchAddresses };
};

const renderAddressOption = (
  props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
  option: AddressFeature
) => {
  const { key, ...restProps } = props;
  const { label, context, type } = option.properties;

  return (
    <li key={key} {...restProps}>
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
      label = "Lancer le diagnostic sonore",
      light = false,
      isMobile = false
    }: AddressSearchProps,
    ref: React.Ref<{ reset: () => void }>
  ) => {
    const { cx, classes } = useStyles({ light });

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
      <div className={cx(classes.container, className, "fr-grid-row", "fr-col-12")}>
        <form
          className="fr-col-12"
          onSubmit={(e) => {
            e.preventDefault();
            if (onValueSelected) {
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
            getOptionKey={(option) =>
              `${option.geometry.coordinates[0]},${option.geometry.coordinates[1]}`
            }
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
            disabled={!!inputValue && !valueSelected}
            type="submit"
            aria-label={label}
            iconId="fr-icon-search-line"
            iconPosition="left"
            className={cx(classes.submitButton, light ? "" : "fr-col-md-5")}
          >
            {light || isMobile ? "" : label}
          </Button>
        </form>
      </div>
    );
  }
);

const useStyles = tss.withParams<{ light: boolean }>().create(({ light }) => ({
  container: {
    width: "100%",
    form: {
      display: "flex",
      width: "100%",
      borderBottom: `2px solid ${fr.colors.decisions.background.flat.blueFrance.default}`,
    },
  },
  submitButton: {
    display: "flex !important",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 !important",
    fontSize: "1rem !important",
    "&::before": {
      margin: "0 !important",
    },
    borderRadius: "0 4px 0 0",
    gap: fr.spacing("2v"),
  },
  autocomplete: {
    flexGrow: 1,
    ".MuiInputBase-root": {
      backgroundColor: fr.colors.decisions.background.disabled.grey.default,
      borderRadius: "4px 0 0 0",
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
    ".MuiAutocomplete-input": {
      marginLeft: `${fr.spacing("2v")} !important`,
      height: `${light ? "100%" : "auto"}`,
    }
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
