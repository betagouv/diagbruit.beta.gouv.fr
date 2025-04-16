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
import { getNearbySiblings, getRiskFromScore } from "../../utils/map";

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
  const prevSelected = usePrevious(parcelle);

  const mapRef = useCallback((ref: MapRef) => {
    if (ref) {
      setMap(ref.getMap());
    }
  }, []);

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
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

          const nearbySiblings = getNearbySiblings(feature, siblings, 500);
          setParcelleSiblings(nearbySiblings.slice(0, 16));
        }

        setParcelle(clickedParcelle);
      } else {
        setParcelle(null);
      }
    },
    [map, parcelle]
  );

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

      const siblings = parcelleSiblings.map((sibling) => {
        const { commune, section, numero } = sibling.properties;
        return {
          parcelle: {
            code_insee: commune,
            section: section.toString().padStart(2, "0"),
            numero: numero.toString().padStart(4, "0"),
          },
          geometry: (sibling.geometry as any).coordinates,
        };
      });

      setIsLoading(true);
      fetch(`${process.env.API_URL}/diag/generate/from-geometries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              parcelle: {
                code_insee,
                section,
                numero,
              },
              geometry: (parcelle.geometry as any).coordinates,
            },
            ...siblings,
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

  useEffect(() => {
    if (map && parcelle && prevSelected) {
      map.setFeatureState(
        {
          source: "cadastre",
          sourceLayer: "parcelles",
          id: prevSelected.id,
        },
        { outlinePrimary: false, outlineSecondary: true }
      );
    }
  }, [parcelle]);

  useEffect(() => {
    if (isMapLoaded && map && parcelle && response && response.diagnostics) {
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

        if (!!targetParcelle) {
          if (targetParcelle.id === parcelle.id) {
            console.log("set : ", targetParcelle.id);
            map.setFeatureState(
              {
                source: "cadastre",
                sourceLayer: "parcelles",
                id: targetParcelle.id,
              },
              {
                risk: getRiskFromScore(item.diagnostic.score),
                selected: false,
                outlinePrimary: true,
              }
            );
          } else {
            map.setFeatureState(
              {
                source: "cadastre",
                sourceLayer: "parcelles",
                id: targetParcelle.id,
              },
              {
                risk: getRiskFromScore(item.diagnostic.score),
                outlineSecondary: true,
              }
            );
          }
        }
      });
    }
  }, [response]);

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
