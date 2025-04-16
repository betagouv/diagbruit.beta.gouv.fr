import { useEffect } from "react";
import { MapGeoJSONFeature, MapInstance } from "react-map-gl/maplibre";
import { HoverInfo } from "./MapComponent";

export function useHoverFeatureState(
  map: MapInstance | undefined,
  hovered: HoverInfo | null,
  prevHovered?: HoverInfo | null
) {
  useEffect(() => {
    if (!map) return;
    if (prevHovered) {
      map.setFeatureState(
        {
          source: "cadastre",
          sourceLayer: "parcelles",
          id: prevHovered.feature.id,
        },
        { hover: false }
      );
    }
    if (hovered) {
      map.setFeatureState(
        {
          source: "cadastre",
          sourceLayer: "parcelles",
          id: hovered.feature.id,
        },
        { hover: true }
      );
    }
  }, [hovered]);
}

export function useOutlinePreviousSelection(
  map: MapInstance | undefined,
  parcelle: MapGeoJSONFeature | null,
  prevSelected: any
) {
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
  }, [map, parcelle]);
}
