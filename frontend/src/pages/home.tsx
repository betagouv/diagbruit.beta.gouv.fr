import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import HomeHero from "../components/home/HomeHero";
import ParcelleSearch from "../components/search/ParcelleSearch";
import { useNavigate } from "react-router-dom";

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
    <div>
      <div className={fr.cx("fr-mt-10v")}>
        <HomeHero />
      </div>
      <div className={cx(classes.subtitle, fr.cx("fr-mt-6v"))}>
        <img src="/images/search.svg" />
        <h2>Rechercher une parcelle et obtenir son diagnostic DiagBruit</h2>
      </div>
      <p className={cx(classes.searchText)}>
        Effectuez une <b>recherche avancée de parcelle</b>
      </p>
      <ParcelleSearch
        onParcelleRequested={(response, values) => {
          const feature = response.data?.features[0] || {
            errorFrom: values,
          };
          navigate({
            pathname: "/diagnostic",
            search: `?parcelle=${JSON.stringify(feature)}`,
          });
        }}
        formValues={formValues}
      />
    </div>
  );
}

const useStyles = tss.withName(HomePage.name).create(() => ({
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
    marginTop: fr.spacing("6v"),
  },
}));

export default HomePage;
