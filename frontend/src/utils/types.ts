export type DiagnosticResponse = {
  diagnostics: DiagnosticItem[];
};

export type DiagnosticItem = {
  parcelle: Parcelle;
  diagnostic: Diagnostic;
};

export type Parcelle = {
  code_insee: string;
  section: string;
  numero: string;
};

export type Diagnostic = {
  score: number;
  max_db_lden: number;
  flags: DiagnosticFlags;
  land_intersections_ld: LandIntersection[];
  land_intersections_ln: LandIntersection[];
  air_intersections: any[]; // Si le contenu est connu, remplacez `any`
  soundclassification_intersections: SoundClassificationIntersection[];
};

export type DiagnosticFlags = {
  hasClassificationWarning: boolean;
  isMultiExposedSources: boolean;
  isMultiExposedLdenLn: boolean;
  isPriorityZone: boolean;
};

export type LandIntersection = {
  typeterr: string;
  typesource: string;
  indicetype: string;
  codeinfra: string | null;
  legende: number;
  cbstype: string;
};

export type SoundClassificationIntersection = {
  source: string;
  typesource: string;
  codeinfra: string;
  sound_category: number;
  distance: number;
};
