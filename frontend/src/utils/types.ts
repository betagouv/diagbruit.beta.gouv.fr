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
  flags: DiagnosticFlags;
  land_intersections_ld: LandIntersection[];
  land_intersections_ln: LandIntersection[];
  air_intersections: AirIntersection[];
  soundclassification_intersections: SoundClassificationIntersection[];
  equivalent_ambiences: string[];
  recommendations: Recommendations[];
};

export type DiagnosticFlags = {
  hasClassificationWarning: boolean;
  isMultiExposedSources: boolean;
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
  percent_impacted: number;
  direction: Cardinality;
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
  distance: number;
};

export type RecommendationCategory = {
  id: number;
  title: string;
};

export type Recommendations = {
  title: string;
  categories: RecommendationCategory[];
  content: string;
  links: {
    href: string;
    title: string;
  }[];
};

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

export type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;
