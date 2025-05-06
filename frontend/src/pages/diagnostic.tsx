import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useEffect, useRef, useState } from "react";
import { MapGeoJSONFeature } from "react-map-gl/maplibre";
import { tss } from "tss-react/dsfr";
import Diagnostic from "../components/diagnostic/Diagnostic";
import MapComponent, {
  ExposedMapMethods,
} from "../components/map/MapComponent";
import ParcelleSearch from "../components/search/ParcelleSearch";
import { Loader } from "../components/ui/Loader";
import { computeParcelleSiblings, findFeatureAsync } from "../utils/map";
import { DiagnosticItem } from "../utils/types";
import { useLocation } from "react-router-dom";
import { getZoomFromGouvType } from "../utils/tools";
import { AddressFeature } from "../components/search/AddressSearch";

const defaultSearchValues = {
  codeInsee: "",
  prefix: "",
  section: "",
  numero: "",
};

function DiagnosticPage() {
  const { cx, classes } = useStyles();
  const location = useLocation();

  const mapMethodsRef = useRef<ExposedMapMethods>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [parcelleError, setParcelleError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticsResponses, setDiagnosticsResponses] = useState<
    DiagnosticItem[]
  >([]);

  const [searchValues, setSearchValues] = useState(defaultSearchValues);

  const [addressDefaultValue, setAddressDefaultValue] =
    useState<AddressFeature>();

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

  const reset = () => {
    if (mapMethodsRef.current?.setParcelle) {
      mapMethodsRef.current?.setParcelle(null);
    }
    if (mapMethodsRef.current?.setParcelleSiblings) {
      mapMethodsRef.current?.setParcelleSiblings([]);
    }

    setDiagnosticsResponses([]);
    setSearchValues(defaultSearchValues);
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

      setParcelleError(false);

      setSearchValues({
        codeInsee: commune,
        section: section,
        prefix: prefixe,
        numero: numero,
      });
    }
  }, [mapMethodsRef.current?.parcelle]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const parcelleParam = searchParams.get("parcelle");
    const addressParam = searchParams.get("address");

    if (!isMapReady || !(parcelleParam || addressParam)) return;

    if (parcelleParam) {
      try {
        const parcelleFeature = JSON.parse(parcelleParam);
        if (
          parcelleFeature &&
          typeof parcelleFeature === "object" &&
          "geometry" in parcelleFeature
        ) {
          setIsLoading(true);
          onParcelleSelected(parcelleFeature);
        } else {
          if (parcelleFeature.errorFrom) {
            setSearchValues({
              codeInsee: parcelleFeature.errorFrom.codeInsee,
              prefix: parcelleFeature.errorFrom.prefix,
              section: parcelleFeature.errorFrom.section,
              numero: parcelleFeature.errorFrom.numero,
            });
          }
          setParcelleError(true);
        }
      } catch {
        setParcelleError(true);
      }
    } else if (addressParam) {
      try {
        const addressFeature = JSON.parse(addressParam) as AddressFeature;
        if (
          addressFeature &&
          typeof addressFeature === "object" &&
          "geometry" in addressFeature
        ) {
          if (mapMethodsRef.current?.map) {
            setAddressDefaultValue(addressFeature);
            mapMethodsRef.current.map.flyTo({
              center: [
                addressFeature.geometry.coordinates[0],
                addressFeature.geometry.coordinates[1],
              ],
              zoom: getZoomFromGouvType(addressFeature.properties.type),
              essential: true,
              speed: 10,
            });
          }
        }
      } catch {
        console.error("Error parsing address data");
      }
    }
  }, [location.search, isMapReady]);

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
              if (mapMethodsRef.current?.resetAddress) {
                mapMethodsRef.current.resetAddress();
              }

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
          onReady={() => {
            setIsMapReady(true);
          }}
          onReset={reset}
          addressDefaultValue={addressDefaultValue}
        />
        {diagnosticsResponses && diagnosticsResponses[0] && (
          <div className={fr.cx("fr-mt-6v")}>
            <Diagnostic
              diagnosticItem={diagnosticsResponses[0]}
              isLoading={false}
            />
          </div>
        )}
        {!diagnosticsResponses.length &&
          (parcelleError || addressDefaultValue) && (
            <Alert
              className={fr.cx("fr-mt-6v")}
              description="Naviguez sur la carte et sélectionnez une parcelle pour afficher le diagnostic"
              onClose={function noRefCheck() {}}
              severity="info"
              title={
                parcelleError
                  ? "Vous ne trouvez pas votre parcelle ?"
                  : "Vous y êtes presque !"
              }
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
    marginTop: fr.spacing("8v"),
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
