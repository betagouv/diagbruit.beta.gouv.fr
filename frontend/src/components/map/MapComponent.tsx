import Map, {
  MapGeoJSONFeature,
  MapInstance,
  MapLayerMouseEvent,
  MapRef,
  StyleSpecification,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import orthoStyle from "./styles/ortho.json";
import { useCallback, useEffect, useState } from "react";
import {
  getNearbySiblings,
  mergeCoordinatesByParcelle,
  updateFeatureState,
} from "../../utils/map";
import usePrevious from "../hooks/previous";
import { useDiagnostics } from "./useDiagnostics";
import {
  useHoverFeatureState,
  useOutlinePreviousSelection,
} from "./useMapFeatureState";
import { DiagnosticItem } from "../../utils/types";
import { getRiskFromScore } from "../../utils/tools";
import { centroid } from "@turf/turf";

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
  onLoading: (loading: boolean) => void;
};

function MapComponent({ onDiagnosticsChange, onLoading }: MapComponentProps) {
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
        let clickedParcelle = feature as MapGeoJSONFeature;

        if (parcelle && parcelle.id) {
          updateFeatureState(map, parcelle.id, { selected: false });
        }

        if (clickedParcelle.id) {
          updateFeatureState(map, clickedParcelle.id, { selected: true });
        }

        const sameTiles = map.queryRenderedFeatures({
          layers: ["parcelles-fill"],
          filter: [
            "all",
            ["==", ["get", "commune"], feature.properties.commune],
            ["==", ["get", "section"], feature.properties.section],
            ["==", ["get", "numero"], feature.properties.numero],
          ],
        });
        clickedParcelle = mergeCoordinatesByParcelle(sameTiles)[0];

        const siblings = map.queryRenderedFeatures({
          layers: ["parcelles-fill"],
          filter: [
            "all",
            ["==", ["get", "commune"], feature.properties.commune],
            ["==", ["get", "section"], feature.properties.section],
            ["!=", ["get", "numero"], feature.properties.numero],
          ],
        });

        const nearbySiblings = getNearbySiblings(
          clickedParcelle,
          mergeCoordinatesByParcelle(siblings),
          1000
        );
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

  useEffect(() => {
    onLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (isMapLoaded && response?.diagnostics) {
      handleDiagnostics();
    }
  }, [isMapLoaded, response]);

  useEffect(() => {
    const geometry = parcelle?.geometry as any;
    if (!map || !parcelle || !geometry?.coordinates) return;

    const centerPoint = centroid(parcelle);
    const [lng, lat] = centerPoint.geometry.coordinates;

    const offsetLng = lng - 0;

    map.flyTo({
      center: [offsetLng, lat],
      zoom: 18,
      essential: true,
    });
  }, [map, parcelle]);

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
        style={{ width: "100%", height: "600px" }}
        mapStyle={orthoStyle as StyleSpecification}
        interactiveLayerIds={interactiveLayerIds}
        cursor={cursor}
      />
    </div>
  );
}

export default MapComponent;
