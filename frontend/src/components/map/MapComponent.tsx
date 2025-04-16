import Map, {
  MapGeoJSONFeature,
  MapInstance,
  MapLayerMouseEvent,
  MapRef,
  StyleSpecification,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import orthoStyle from "./styles/ortho.json";
import { useCallback, useState } from "react";
import {
  getNearbySiblings,
  getRiskFromScore,
  updateFeatureState,
} from "../../utils/map";
import usePrevious from "../hooks/previous";
import { useDiagnostics } from "./useDiagnostics";
import {
  useHoverFeatureState,
  useOutlinePreviousSelection,
} from "./useMapFeatureState";
import { DiagnosticItem } from "../../utils/types";

const interactiveLayerIds = ["parcelles-fill"];

// Bordeaux center
const defaultViewState = {
  longitude: -0.57918,
  latitude: 44.837789,
  zoom: 12,
};

export type HoverInfo = {
  longitude: number;
  latitude: number;
  feature: MapGeoJSONFeature;
};

type MapComponentProps = {
  onDiagnosticsChange: (newDiagnostics: DiagnosticItem[]) => void;
};

function MapComponent({ onDiagnosticsChange }: MapComponentProps) {
  const [map, setMap] = useState<MapInstance>();
  const [parcelle, setParcelle] = useState<MapGeoJSONFeature | null>(null);
  const [parcelleSiblings, setParcelleSiblings] = useState<MapGeoJSONFeature[]>(
    []
  );
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const [cursor, setCursor] = useState("default");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const prevHovered = usePrevious(hovered);
  const prevSelected = usePrevious(parcelle);

  const { response, isLoading } = useDiagnostics(parcelle, parcelleSiblings);

  useHoverFeatureState(map, hovered, prevHovered);
  useOutlinePreviousSelection(map, parcelle, prevSelected);

  const mapRef = useCallback((ref: MapRef) => {
    if (ref) setMap(ref.getMap());
  }, []);

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      event.originalEvent.stopPropagation();
      const feature = event.features?.[0];

      if (feature?.layer.id === "parcelles-fill" && map) {
        const clickedParcelle = feature as MapGeoJSONFeature;

        if (parcelle && parcelle.id) {
          updateFeatureState(map, parcelle.id, { selected: false });
        }

        if (clickedParcelle.id) {
          updateFeatureState(map, clickedParcelle.id, { selected: true });
        }

        const siblings = map.queryRenderedFeatures({
          layers: ["parcelles"],
          filter: [
            "all",
            ["==", ["get", "commune"], feature.properties.commune],
            ["==", ["get", "section"], feature.properties.section],
          ],
        });

        const nearbySiblings = getNearbySiblings(feature, siblings, 500);
        setParcelleSiblings(nearbySiblings.slice(0, 16));
        setParcelle(clickedParcelle);
      } else {
        setParcelle(null);
      }
    },
    [map, parcelle]
  );

  const onHover = (event: MapLayerMouseEvent) => {
    event.originalEvent.stopPropagation();
    const feature = event.features?.[0];
    const { lng, lat } = event.lngLat;

    setHovered(feature ? { longitude: lng, latitude: lat, feature } : null);

    if (event.type === "mouseenter") {
      setCursor("pointer");
    } else if (event.type === "mouseleave") {
      setCursor("default");
    }
  };

  const handleDiagnostics = useCallback(() => {
    if (!map || !parcelle || !response?.diagnostics) return;

    onDiagnosticsChange(response.diagnostics);

    const allParcelles = [...parcelleSiblings, parcelle];

    response.diagnostics.forEach((item: any) => {
      const targetParcelle = allParcelles.find((p) => {
        const {
          commune: code_insee,
          section: tmpSection,
          numero: tmpNumero,
        } = p.properties;
        const numero = tmpNumero.toString().padStart(4, "0");
        const section = tmpSection.toString().padStart(2, "0");

        return (
          code_insee === item.parcelle.code_insee &&
          section === item.parcelle.section &&
          numero === item.parcelle.numero
        );
      });

      if (targetParcelle) {
        const featureState = {
          risk: getRiskFromScore(item.diagnostic.score),
          ...(targetParcelle.id === parcelle.id
            ? { selected: false, outlinePrimary: true }
            : { outlineSecondary: true }),
        };

        if (targetParcelle.id) {
          updateFeatureState(map, targetParcelle.id, featureState);
        }
      }
    });
  }, [map, parcelle, parcelleSiblings, response]);

  if (isMapLoaded && response?.diagnostics) {
    handleDiagnostics();
  }

  return (
    <div style={{ display: "flex" }}>
      <Map
        ref={mapRef}
        initialViewState={defaultViewState}
        onLoad={() => setIsMapLoaded(true)}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onHover}
        onMouseMove={onHover}
        style={{ width: "50vw", height: "50vh" }}
        mapStyle={orthoStyle as StyleSpecification}
        interactiveLayerIds={interactiveLayerIds}
        cursor={cursor}
      />
    </div>
  );
}

export default MapComponent;
