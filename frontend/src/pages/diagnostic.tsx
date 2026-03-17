import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useEffect, useRef, useState } from "react";
import type { MapGeoJSONFeature } from "react-map-gl/maplibre";
import { useLocation } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import Diagnostic from "../components/diagnostic/Diagnostic";
import MapComponent, {
  type ExposedMapMethods,
} from "../components/map/MapComponent";
import type { AddressFeature } from "../components/search/AddressSearch";
import ParcelleSearch from "../components/search/ParcelleSearch";
import { Loader } from "../components/ui/Loader";
import { decode } from "../utils/compression";
import { computeParcelleSiblings, findFeatureAsync } from "../utils/map";
import { getZoomFromGouvType } from "../utils/tools";
import type { DiagnosticItem } from "../utils/types";

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
  const [notIntegrated, setNotIntegrated] = useState(false);
  const [internalServerError, setInternalServerError] = useState(false);
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

      if ((parcelleFeature as any).geometry) {
        const coords = (parcelleFeature as any).geometry.coordinates;
        let minLng = Infinity,
          minLat = Infinity,
          maxLng = -Infinity,
          maxLat = -Infinity;

        const flattenCoords = (coordArray: any[]): void => {
          coordArray.forEach((item) => {
            if (Array.isArray(item[0])) {
              flattenCoords(item);
            } else {
              const [lng, lat] = item;
              minLng = Math.min(minLng, lng);
              minLat = Math.min(minLat, lat);
              maxLng = Math.max(maxLng, lng);
              maxLat = Math.max(maxLat, lat);
            }
          });
        };

        flattenCoords(coords);

        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;

        map.flyTo({
          center: [centerLng, centerLat],
          zoom: 15,
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
                    1000,
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

    setNotIntegrated(false);
    setInternalServerError(false);
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
        const parcelleFeature = decode(parcelleParam);

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
        const addressFeature = decode(addressParam) as AddressFeature;
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
            onClose={function noRefCheck() { }}
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
          noisePins={
            diagnosticsResponses[0]?.diagnostic?.noisesource_intersections || []
          }
          onDiagnosticsChange={onDiagnosticsChange}
          onLoading={onLoading}
          onReady={() => {
            setIsMapReady(true);
          }}
          onReset={reset}
          onErrorChange={(error) => {
            setDiagnosticsResponses([]);
            setNotIntegrated(error?.code === 404);
            setInternalServerError(error?.code === 500);
          }}
          addressDefaultValue={addressDefaultValue}
        />
        {diagnosticsResponses?.[0] && (
          <div className={fr.cx("fr-mt-6v")}>
            <Diagnostic
              diagnosticItem={diagnosticsResponses[0]}
              isLoading={false}
            />
          </div>
        )}
        {!diagnosticsResponses.length &&
          !notIntegrated &&
          (parcelleError || addressDefaultValue) && (
            <Alert
              className={fr.cx("fr-mt-6v")}
              description="Naviguez sur la carte et sélectionnez une parcelle pour afficher le diagnostic"
              onClose={function noRefCheck() { }}
              severity="info"
              title={
                parcelleError
                  ? "Vous ne trouvez pas votre parcelle ?"
                  : "Vous y êtes presque !"
              }
            />
          )}

        {notIntegrated && (
          <Alert
            className={fr.cx("fr-my-4v")}
            description={
              <div className={fr.cx("fr-mt-2v")}>
                Malheureusement, cette parcelle ne figure pas dans les données
                actuellement disponibles.
                <div className={fr.cx("fr-mt-1v")}>
                  <a href="https://tally.so/r/3xoeEd" target="_blank" rel="noopener">
                    Vous jugez cela dommage 😞 ? Dites le nous.
                  </a>
                </div>
              </div>
            }
            onClose={function noRefCheck() { }}
            severity="error"
            title="Parcelle non référencée dans diagBruit"
          />
        )}

        {internalServerError && (
          <Alert
            className={fr.cx("fr-my-4v")}
            description={
              <div className={fr.cx("fr-mt-2v")}>
                Une erreur technique est survenue lors de la génération du
                diagnostic. Veuillez réessayer ultérieurement.
                <div className={fr.cx("fr-mt-1v")}>
                  Si le problème persiste,{" "}
                  <a href="https://tally.so/r/3xoeEd" target="_blank" rel="noopener">
                    contactez-nous
                  </a>
                  .
                </div>
              </div>
            }
            onClose={function noRefCheck() { }}
            severity="error"
            title="Erreur lors de la génération du diagnostic"
          />
        )}
      </div>
    </div>
  );
}

const useStyles = tss.create(() => ({
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
    height: "100%",
    width: "100%",
    zIndex: 9999,
  },
}));

export default DiagnosticPage;
