import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import HomeHero from "../components/home/HomeHero";
import ParcelleSearch from "../components/search/ParcelleSearch";
import { useNavigate } from "react-router-dom";
import AddressSearch, {
  AddressFeature,
} from "../components/search/AddressSearch";
import { encode } from "../utils/compression";

function HomePage() {
  const { cx, classes } = useStyles();
  const navigate = useNavigate();

  let formValues;

  if (process.env.NODE_ENV === "development") {
    formValues = {
      codeInsee: "44020",
      prefix: "000",
      section: "BI",
      numero: "0148",
    };
  }

  return (
    <div className={fr.cx("fr-my-10v")}>
      <HomeHero />
      <div className={cx(classes.subtitle, fr.cx("fr-mt-6v"))}>
        <img src="/images/search.svg" />
        <h2>Rechercher une parcelle et obtenir son diagnostic diagBruit</h2>
      </div>
      <p className={cx(fr.cx("fr-mt-10v"), classes.searchText)}>
        Effectuez une <b>recherche avancée de parcelle</b>
      </p>
      <ParcelleSearch
        onParcelleRequested={(response, values) => {
          const feature = response.data?.features[0] || {
            errorFrom: values,
          };
          navigate({
            pathname: "/diagnostic",
            search: `?parcelle=${encode(feature)}`,
          });
        }}
        formValues={formValues}
      />
      <div className={fr.cx("fr-mt-10v")}>
        <p className={cx(classes.searchText)}>
          Ou recherchez <b>une adresse / une zone géographique</b> pour accéder
          à la carte et sélectionner une parcelle{" "}
        </p>
        <label htmlFor="mapSearch">Adresse ou zone géographique</label>
        <p className={fr.cx("fr-hint-text", "fr-mb-2v")}>
          Saisissez quelques caractères pour voir des suggestions
        </p>
        <AddressSearch
          className={classes.searchAddress}
          placeholder="Cherchez une ville, adresse..."
          id="mapSearch"
          onValueSelected={(feature: AddressFeature) => {
            navigate({
              pathname: "/diagnostic",
              search: `?address=${encode(feature)}`,
            });
          }}
          limit={3}
        />
      </div>
    </div>
  );
}

const useStyles = tss.create(() => ({
  subtitle: {
    display: "flex",
    alignItems: "center",
    marginLeft: `-${fr.spacing("3v")}`,
    h2: {
      ...fr.typography[2].style,
      marginBottom: 0,
      marginLeft: fr.spacing("2v"),
    },
  },
  searchText: {
    ...fr.typography[21].style,
  },
  searchAddress: {
    width: "56%",
    [fr.breakpoints.down("md")]: {
      width: "100%",
    },
  },
}));

export default HomePage;
