import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Dispatch, useEffect, useRef, useState } from "react";
import { MapGeoJSONFeature, MapInstance } from "react-map-gl/maplibre";
import { tss } from "tss-react/dsfr";
import Diagnostic from "../components/diagnostic/Diagnostic";
import MapComponent, {
  ExposedMapMethods,
} from "../components/map/MapComponent";
import ParcelleSearch from "../components/search/ParcelleSearch";
import { Loader } from "../components/ui/Loader";
import { computeParcelleSiblings, findFeatureAsync } from "../utils/map";
import { DiagnosticItem } from "../utils/types";

function DiagnosticPage() {
  const { cx, classes } = useStyles();

  const mapMethodsRef = useRef<ExposedMapMethods>(null);

  const [parcelleError, setParcelleError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticsResponses, setDiagnosticsResponses] = useState<
    DiagnosticItem[]
  >([]);

  const [searchValues, setSearchValues] = useState({
    codeInsee: "",
    prefix: "000",
    section: "",
    numero: "",
  });

  const onParcelleSelected = (parcelleFeature: MapGeoJSONFeature) => {
    if (mapMethodsRef.current?.map) {
      const map = mapMethodsRef.current.map;
      if ((parcelleFeature as any).bbox) {
        const [minLng, minLat, maxLng, maxLat] = (parcelleFeature as any).bbox;

        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;

        map.flyTo({
          center: [centerLng, centerLat],
          zoom: 17,
          essential: true,
          speed: 10,
        });

        map.once("moveend", () => {
          const idu = parcelleFeature.properties.idu;
          findFeatureAsync(map, idu).then((feature) => {
            if (mapMethodsRef.current?.setParcelle) {
              if (mapMethodsRef.current?.setParcelleSiblings) {
                const { clickedParcelle, nearbySiblings } =
                  computeParcelleSiblings(
                    map,
                    feature as MapGeoJSONFeature,
                    1000
                  );
                mapMethodsRef.current.setParcelleSiblings(nearbySiblings);
                mapMethodsRef.current.setParcelle(clickedParcelle);
              }
            }
          });
        });
      }
    }
  };

  const onLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const onDiagnosticsChange = (newDiagnostics: DiagnosticItem[]) => {
    setDiagnosticsResponses(newDiagnostics);
  };

  useEffect(() => {
    if (mapMethodsRef.current?.parcelle) {
      const { parcelle } = mapMethodsRef.current;
      const {
        commune,
        section: tmpSection,
        numero: tmpNumero,
        prefixe,
      } = parcelle.properties;
      const numero = tmpNumero.toString().padStart(4, "0");
      const section = tmpSection.toString().padStart(2, "0");

      setSearchValues({
        codeInsee: commune,
        section: section,
        prefix: prefixe,
        numero: numero,
      });
    }
  }, [mapMethodsRef.current?.parcelle]);

  return (
    <div>
      {isLoading && (
        <div className={cx(classes.loaderContainer)}>
          <Loader text="Nous générons votre diagnostic..." />
        </div>
      )}
      <div className={cx(classes.container)}>
        <h1 className={fr.cx("fr-mb-4v")}>Votre recherche de parcelle</h1>
        {parcelleError && (
          <Alert
            className={fr.cx("fr-my-4v")}
            description="Veuillez rechercher une parcelle, une adresse ou une zone géographique en France métropolitaine ou dans les DOM TOM."
            onClose={function noRefCheck() {}}
            severity="error"
            title="Votre recherche n’est pas référencée dans diagBruit"
          />
        )}
        <div className={fr.cx("fr-mt-4v")}>
          <ParcelleSearch
            formValues={searchValues}
            onChange={() => {
              setParcelleError(false);
            }}
            onParcelleRequested={(response) => {
              console.log("there");
              setDiagnosticsResponses([]);
              if (response.data?.features[0]) {
                const parcelleFeature = response.data?.features[0];
                onParcelleSelected(parcelleFeature);
              } else {
                setParcelleError(true);
              }
            }}
          />
        </div>
        <MapComponent
          ref={mapMethodsRef}
          onDiagnosticsChange={onDiagnosticsChange}
          onLoading={onLoading}
        />
        {diagnosticsResponses && diagnosticsResponses[0] && (
          <div className={fr.cx("fr-mt-6v")}>
            <Diagnostic
              diagnosticItem={diagnosticsResponses[0]}
              isLoading={false}
            />
          </div>
        )}
        {!diagnosticsResponses.length && parcelleError && (
          <Alert
            className={fr.cx("fr-mt-6v")}
            description="Naviguez sur la carte et sélectionnez une parcelle pour afficher le diagnostic"
            onClose={function noRefCheck() {}}
            severity="info"
            title="Vous ne trouvez pas votre parcelle ?"
          />
        )}
      </div>
    </div>
  );
}

const useStyles = tss.withName(DiagnosticPage.name).create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
  },
  loaderContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    display: "flex",
    position: "fixed",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    zIndex: 9999,
  },
}));

export default DiagnosticPage;
