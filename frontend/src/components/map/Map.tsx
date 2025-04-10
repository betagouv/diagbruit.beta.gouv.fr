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
import usePrevious from "../hooks/previous";

const interactiveLayerIds = ["parcelles-fill"];
const defaultViewState = {
  longitude: 2.2137,
  latitude: 46.2276,
  zoom: 5,
};

type HoverInfo = {
  longitude: number;
  latitude: number;
  feature: MapGeoJSONFeature;
};

function MapComponent() {
  const [map, setMap] = useState<MapInstance>();
  const [parcelle, setParcelle] = useState<MapGeoJSONFeature | null>(null);
  const [parcelleSiblings, setParcelleSiblings] = useState<MapGeoJSONFeature[]>(
    []
  );
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const [cursor, setCursor] = useState("default");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [response, setResponse] = useState<any>();

  const prevHovered = usePrevious(hovered);

  const mapRef = useCallback((ref: MapRef) => {
    if (ref) {
      setMap(ref.getMap());
    }
  }, []);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    event.originalEvent.stopPropagation();
    const feature = event.features && event.features[0];

    if (feature && feature.layer.id === "parcelles-fill") {
      const clickedParcelle = feature as MapGeoJSONFeature;

      if (map) {
        if (parcelle) {
          map.setFeatureState(
            {
              source: "cadastre",
              sourceLayer: "parcelles",
              id: parcelle.id,
            },
            { selected: false }
          );
        }
        map.setFeatureState(
          {
            source: "cadastre",
            sourceLayer: "parcelles",
            id: clickedParcelle.id,
          },
          { selected: true }
        );

        const siblings = map.queryRenderedFeatures({
          layers: ["parcelles"],
          filter: [
            "all",
            ["==", ["get", "commune"], feature.properties.commune],
            ["==", ["get", "section"], feature.properties.section],
          ],
        });

        setParcelleSiblings(siblings);
      }

      setParcelle(clickedParcelle);
    } else {
      setParcelle(null);
    }
  }, []);

  const onHover = (event: MapLayerMouseEvent) => {
    event.originalEvent.stopPropagation();
    const feature = event.features && event.features[0];
    const longitude = event.lngLat.lng;
    const latitude = event.lngLat.lat;
    let hoverInfo = null;
    if (feature) {
      hoverInfo = {
        longitude,
        latitude,
        feature,
      };
    }

    setHovered(hoverInfo);
    if (event.type === "mouseenter") {
      setCursor("pointer");
    } else if (event.type === "mouseleave") {
      setCursor("default");
    }
  };

  useEffect(() => {
    if (parcelle && parcelle.properties) {
      const {
        commune: code_insee,
        section: tmpSection,
        numero: tmpNumero,
      } = parcelle.properties;
      const numero = tmpNumero.toString().padStart(4, "0");
      const section = tmpSection.toString().padStart(2, "0");

      console.log(parcelleSiblings);

      const siblings = parcelleSiblings.map((sibling) => {
        const { commune, section, numero } = sibling.properties;
        return {
          code_insee: commune,
          section: section.toString().padStart(2, "0"),
          numero: numero.toString().padStart(4, "0"),
        };
      });

      setIsLoading(true);
      fetch("http://localhost:8000/diag/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parcelles: [
            {
              code_insee,
              section,
              numero,
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => setResponse(data))
        .catch((err) => console.error("Erreur:", err))
        .finally(() => setIsLoading(false));
    }
  }, [parcelle]);

  useEffect(() => {
    if (map) {
      if (prevHovered) {
        const { id } = prevHovered.feature;
        map.setFeatureState(
          {
            source: "cadastre",
            sourceLayer: "parcelles",
            id,
          },
          { hover: false }
        );
      }

      if (hovered) {
        const { id } = hovered.feature;

        map.setFeatureState(
          {
            source: "cadastre",
            sourceLayer: "parcelles",
            id,
          },
          { hover: true }
        );
      }
    }
  }, [hovered]);

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
        style={{ width: "80%", height: "100vh" }}
        mapStyle={orthoStyle as StyleSpecification}
        interactiveLayerIds={interactiveLayerIds}
        cursor={cursor}
      />
      <div
        style={{
          width: "20%",
          maxHeight: "100%",
          overflowY: "auto",
          padding: "1rem",
        }}
      >
        {isLoading ? (
          "Chargement..."
        ) : (
          <pre>{JSON.stringify(response, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
export default MapComponent;
