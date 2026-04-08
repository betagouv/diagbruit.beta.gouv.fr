export type DiagnosticResponseOk = {
  diagnostics: DiagnosticItem[];
};

export type DiagnosticResponseError = {
  code: number;
  message: string;
};

export type DiagnosticItem = {
  parcelle: Parcelle;
  diagnostic: Diagnostic;
};

export type Geometry = [[[number, number]]];

export type Parcelle = {
  code_insee: string;
  section: string;
  numero: string;
  geometry: Geometry;
};

export type Diagnostic = {
  score: number;
  max_db_lden: number;
  min_db_lden: number;
  isolation_min: number | null;
  isolation_max: number | null;
  flags: DiagnosticFlags;
  land_intersections_ld: LandIntersection[];
  land_intersections_ln: LandIntersection[];
  zones: Zone[];
  air_intersections: AirIntersection[];
  soundclassification_intersections: SoundClassificationIntersection[];
  noisesource_intersections: NoiseSourceIntersection[];
  noisezone_intersections: NoiseZoneIntersection[];
  equivalent_ambiences: string[];
};

export type DiagnosticFlags = {
  hasClassificationWarning: boolean;
  hasNoisemapWarning: boolean;
  isMultiExposedSources: boolean;
  isMultiExposedLandSources: boolean;
  isMultiExposedLandDistinctTypeSources: boolean;
  isMultiExposedLdenLn: boolean;
  isPriorityZone: boolean;
};

export type Cardinality = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW";

export type LandIntersection = {
  typeterr: string;
  typesource: string;
  indicetype: string;
  codeinfra: string | null;
  legende: number;
  cbstype: string;
  geometry_intersection: Geometry;
  percent_impacted: number;
  direction: Cardinality;
};

export type Zone = {
  risk: number;
  geometry: Geometry;
};

export type AirIntersection = {
  zone: ("A" | "B" | "C" | "D") | null;
  legende: number;
  nom: string;
  ref_doc: string;
  percent_impacted: number;
};

export type SoundClassificationIntersection = {
  source: string;
  typesource: string;
  codeinfra: string;
  sound_category: number;
  min_distance: number;
  max_distance: number;
  geometry_intersection: Geometry;
  geometry_source_point: [number, number];
  percent_impacted: number;
};

export type NoiseSourceIntersection = {
  label: string;
  category_slug: string;
  category_name: string;
  category_description: string;
  distance: number;
  geometry: Geometry | [number, number];
  geometry_point: [number, number];
};

export type NoiseZoneIntersection = {
  label: "Zone de calme" | "Zone soumise au bruit";
  alert: string;
  geometry: Geometry;
};

export type RecommendationCategory = {
  id: number;
  title: string;
};

export type Recommendation = {
  title: string;
  categories: RecommendationCategory[];
  content: string;
  isolation: boolean;
  conditions: {
    isolation_gte: number | null;
    isolation_lte: number | null;
  };
  links: {
    href: string;
    title: string;
  }[];
};

export type Decree = {
  id: number;
  link: string;
  codedept: number;
  title: string;
};

export type LocalDocumentation = {
  id: number;
  documentId: string;
  name: string;
  link: string;
  priority: number;
  codeinsees: { id: number; codeinsee: string }[];
};

export type Settings = {
  maintenance: boolean;
};

export type Changelog = {
  id: number;
  title: string;
  content: string;
  date: string;
};

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

export type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export type SoundClassificationIntersectionAffectedHelper = {
  intersection: SoundClassificationIntersection;
  doesAffectOptimalZone: boolean;
  preciseDistance: number;
  isolation: number;
};
