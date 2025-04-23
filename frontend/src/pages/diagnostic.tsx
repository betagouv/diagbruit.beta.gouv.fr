import { fr } from "@codegouvfr/react-dsfr";
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

  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticsResponses, setDiagnosticsResponses] = useState<
    DiagnosticItem[]
  >([]);

  const [searchValues, setSearchValues] = useState({
    codeInsee: "",
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
              mapMethodsRef.current.setParcelle(feature);

              if (mapMethodsRef.current?.setParcelleSiblings) {
                const { nearbySiblings } = computeParcelleSiblings(
                  map,
                  feature as MapGeoJSONFeature,
                  1000
                );
                mapMethodsRef.current.setParcelleSiblings(nearbySiblings);
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
      console.log(parcelle.properties);
      const {
        commune,
        section: tmpSection,
        numero: tmpNumero,
      } = parcelle.properties;
      const numero = tmpNumero.toString().padStart(4, "0");
      const section = tmpSection.toString().padStart(2, "0");

      setSearchValues({
        codeInsee: commune,
        section: section,
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
      <div className={cx(classes.container, fr.cx("fr-container"))}>
        <h1>⚡ Le diagnostic flash DiagBruit</h1>
        <ParcelleSearch
          formValues={searchValues}
          onParcelleRequested={(response) => {
            if (response.data?.features[0]) {
              const parcelleFeature = response.data?.features[0];
              onParcelleSelected(parcelleFeature);
            }
          }}
        />
        <MapComponent
          ref={mapMethodsRef}
          onDiagnosticsChange={onDiagnosticsChange}
          onLoading={onLoading}
        />
        {diagnosticsResponses && diagnosticsResponses[0] && (
          <Diagnostic
            diagnosticItem={diagnosticsResponses[0]}
            isLoading={false}
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
    gap: fr.spacing("6v"),
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
