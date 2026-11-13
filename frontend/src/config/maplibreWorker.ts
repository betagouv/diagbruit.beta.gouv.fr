import { getVersion, setWorkerUrl } from "maplibre-gl";

// Worker copié dans public/ par scripts/copy-maplibre-worker.js (voir ce
// fichier pour le pourquoi). Le paramètre ?v= invalide le cache navigateur à
// chaque montée de version : le worker doit correspondre exactement à la lib.
// Doit s'exécuter avant la création de la première carte.
setWorkerUrl(
  `${process.env.PUBLIC_URL}/maplibre-gl-worker.js?v=${getVersion()}`,
);
