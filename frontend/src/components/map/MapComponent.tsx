import { fr } from "@codegouvfr/react-dsfr";
import { bbox, centroid } from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Dispatch,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Map, {
  MapGeoJSONFeature,
  MapInstance,
  MapLayerMouseEvent,
  MapRef,
  StyleSpecification,
} from "react-map-gl/maplibre";
import { tss } from "tss-react/dsfr";
import usePrevious from "../../hooks/previous";
import { encode } from "../../utils/compression";
import { computeParcelleSiblings, updateFeatureState } from "../../utils/map";
import { getRiskFromScore, getZoomFromGouvType } from "../../utils/tools";
import { DiagnosticItem, DiagnosticResponseError } from "../../utils/types";
import AddressSearch, { AddressFeature } from "../search/AddressSearch";
import orthoStyle from "./styles/ortho.json";
import { useDiagnostics } from "./useDiagnostics";
import {
  useHoverFeatureState,
  useOutlinePreviousSelection,
} from "./useMapFeatureState";

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
  onReady: () => void;
  onReset: () => void;
  onErrorChange: (error?: DiagnosticResponseError) => void;
  addressDefaultValue?: AddressFeature;
};

export interface ExposedMapMethods {
  map: MapInstance | undefined;
  parcelle: MapGeoJSONFeature | null;
  setParcelle: Dispatch<React.SetStateAction<MapGeoJSONFeature | null>> | null;
  setParcelleSiblings: Dispatch<
    React.SetStateAction<MapGeoJSONFeature[]>
  > | null;
  resetAddress?: () => void;
}

const MapComponent = forwardRef<ExposedMapMethods, MapComponentProps>(
  (
    {
      onDiagnosticsChange,
      onLoading,
      onReady,
      onReset,
      onErrorChange,
      addressDefaultValue,
    },
    ref
  ) => {
    const { cx, classes } = useStyles();

    const addressSearchRef = useRef<{ reset: () => void }>(null);

    const [parcelle, setParcelle] = useState<MapGeoJSONFeature | null>(null);
    const [parcelleSiblings, setParcelleSiblings] = useState<
      MapGeoJSONFeature[]
    >([]);
    const [hovered, setHovered] = useState<HoverInfo | null>(null);
    const [cursor, setCursor] = useState("default");
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [diagError, setDiagError] = useState<
      DiagnosticResponseError | undefined
    >();

    const internalMapRef = useRef<MapRef>(null);
    const [map, setMap] = useState<MapInstance>();

    const prevHovered = usePrevious(hovered);
    const prevSelected = usePrevious(parcelle);

    const { response, error, isLoading } = useDiagnostics(
      parcelle,
      parcelleSiblings
    );

    useImperativeHandle(
      ref,
      () => ({
        map,
        parcelle,
        setParcelle,
        setParcelleSiblings,
        resetAddress: addressSearchRef.current?.reset,
      }),
      [map, parcelle, setParcelle, setParcelleSiblings]
    );

    useHoverFeatureState(map, hovered, prevHovered);
    useOutlinePreviousSelection(map, parcelle, prevSelected);

    const mapRef = useCallback((ref: MapRef) => {
      if (ref) {
        internalMapRef.current = ref;
        setMap(ref.getMap());
      }
    }, []);

    const onClick = useCallback(
      (event: MapLayerMouseEvent) => {
        event.originalEvent.stopPropagation();
        const feature = event.features?.[0];

        if (feature?.layer.id === "parcelles-fill" && map) {
          if (parcelle?.id) {
            updateFeatureState(map, parcelle.id, { selected: false });
          }

          const { clickedParcelle, nearbySiblings } = computeParcelleSiblings(
            map,
            feature as MapGeoJSONFeature,
            1000
          );

          if (clickedParcelle?.id) {
            updateFeatureState(map, clickedParcelle.id, { selected: true });
          }

          setParcelleSiblings(nearbySiblings);
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

    const replaceSearchParams = (parcelle: MapGeoJSONFeature) => {
      const queryParcelle = {
        geometry: parcelle._geometry,
        properties: {
          ...parcelle.properties,
          code_insee: parcelle.properties.commune,
          idu: parcelle.properties.id,
        },
        bbox: bbox(parcelle._geometry),
      };
      const params = new URLSearchParams(window.location.search);
      params.set("parcelle", encode(queryParcelle));

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    };

    const handleDiagnostics = useCallback(() => {
      if (!map || !parcelle || !response?.diagnostics) return;

      onDiagnosticsChange(response.diagnostics);

      replaceSearchParams(parcelle);

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

    const onAddressSelected = useCallback(
      (feature: AddressFeature) => {
        if (map) {
          map.flyTo({
            center: [
              feature.geometry.coordinates[0],
              feature.geometry.coordinates[1],
            ],
            zoom: getZoomFromGouvType(feature.properties.type),
            essential: true,
            speed: 10,
          });
        }

        onReset();
      },
      [map]
    );

    useEffect(() => {
      onLoading(isLoading);
    }, [isLoading]);

    useEffect(() => {
      if (isMapLoaded && response?.diagnostics) {
        handleDiagnostics();
      }
    }, [isMapLoaded, response]);

    useEffect(() => {
      if (isMapLoaded) {
        onReady();
      }
    }, [isMapLoaded]);

    useEffect(() => {
      if (onErrorChange) {
        onErrorChange(error);
      }
    }, [error]);

    useEffect(() => {
      const geometry = parcelle?.geometry as any;
      if (!map || !parcelle || !geometry?.coordinates) return;

      const centerPoint = centroid(parcelle);
      const [lng, lat] = centerPoint.geometry.coordinates;

      const offsetLng = lng - 0;

      map.flyTo({
        center: [offsetLng, lat],
        zoom: 17,
        essential: true,
      });
    }, [map, parcelle]);

    return (
      <div className={classes.container}>
        <div className={cx(classes.search)}>
          <label htmlFor="mapSearch">Adresse ou zone géographique</label>
          <p className={fr.cx("fr-hint-text", "fr-mb-2v")}>
            Saisissez quelques caractères pour voir des suggestions
          </p>
          <AddressSearch
            ref={addressSearchRef}
            placeholder="Cherchez une ville, adresse..."
            id="mapSearch"
            onValueSelected={onAddressSelected}
            defaultValue={addressDefaultValue}
          />
        </div>
        <Map
          id="map"
          ref={mapRef}
          initialViewState={defaultViewState}
          onLoad={() => setIsMapLoaded(true)}
          onClick={onClick}
          onMouseEnter={onHover}
          onMouseLeave={onHover}
          onMouseMove={onHover}
          style={{ width: "100%", height: "550px" }}
          mapStyle={orthoStyle as StyleSpecification}
          interactiveLayerIds={interactiveLayerIds}
          cursor={cursor}
        />
      </div>
    );
  }
);

const useStyles = tss.create(() => ({
  container: {
    position: "relative",
  },
  search: {
    position: "absolute",
    left: fr.spacing("4v"),
    top: fr.spacing("4v"),
    width: "40%",
    zIndex: 99,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: fr.spacing("4v"),
    [fr.breakpoints.down("md")]: {
      top: 0,
      left: 0,
      width: "100%",
    },
  },
}));

export default MapComponent;
