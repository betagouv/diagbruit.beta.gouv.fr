import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { Diagnostic, IntRange } from "./types";
import { ReactNode } from "react";
import { TEXTS } from "./texts";

export const getRiskFromScore = (score: number): IntRange<0, 4> => {
  if (score > 8) return 3;
  if (score > 6) return 2;
  if (score > 3) return 1;
  return 0;
};

export const getColorFromScore = (score: number): string => {
  if (score > 8) return "#F95A5C";
  if (score > 6) return "#FA7659";
  if (score > 3) return "#CB9F2D";
  return "#4B9F6C";
};

export const getTextFromScore = (score: number): string => {
  if (score > 8) return "EXTRÊME";
  if (score > 6) return "FORT";
  if (score > 3) return "MOYEN";
  return "FAIBLE";
};

export const getIconeFromScore = (
  score: number
): FrIconClassName | RiIconClassName => {
  if (score > 8) return "ri-close-circle-fill";
  if (score > 6) return "ri-alert-fill";
  if (score > 3) return "ri-information-fill";
  return "ri-checkbox-circle-fill";
};

export const getReadableSource = (source: string): string => {
  switch (source) {
    case "A":
      return "aérien";
    case "T":
      return "tramway";
    case "R":
      return "route";
    case "F":
      return "féroviaire";
    case "I":
      return "industrie";
    default:
      return source;
  }
};

export const extractDiagnosticInfo = (diagnostic: Diagnostic) => {
  const {
    score,
    flags,
    soundclassification_intersections,
    land_intersections_ld,
    land_intersections_ln,
    air_intersections,
  } = diagnostic;

  const risk = getRiskFromScore(score);

  const hasSoundClassificationIntersections =
    soundclassification_intersections.length > 0;
  const hasLandIntersections =
    land_intersections_ld.length > 0 || land_intersections_ln.length > 0;
  const hasAirIntersections = air_intersections.length > 0;

  return {
    flags,
    risk,
    air_intersections,
    land_intersections_ld,
    land_intersections_ln,
    hasSoundClassificationIntersections,
    hasLandIntersections,
    hasAirIntersections,
  };
};

const getSummaryIntroduction = (risk: IntRange<0, 4>): string => {
  return TEXTS.INTRODUCTION[`RISK_${risk}`];
};

const getSummaryConclusion = (risk: number): string => {
  if (risk === 0) {
    return TEXTS.CONCLUSIONS.RISK_0;
  } else if (risk === 1) {
    return TEXTS.CONCLUSIONS.RISK_1;
  } else {
    return TEXTS.CONCLUSIONS.RISK_HIGH;
  }
};

export const getSummaryTextFromDiagnostic = (
  diagnostic: Diagnostic
): string => {
  const {
    air_intersections,
    hasSoundClassificationIntersections,
    hasLandIntersections,
    hasAirIntersections,
    risk,
    flags,
  } = extractDiagnosticInfo(diagnostic);

  if (flags.hasClassificationWarning) {
    return TEXTS.CLASSIFICATION_WARNING;
  }

  if (risk === 0) {
    if (
      hasSoundClassificationIntersections &&
      !hasLandIntersections &&
      !hasAirIntersections
    ) {
      return TEXTS.NO_ISSUE_WITH_ISOLATION;
    } else {
      return TEXTS.NO_ISSUE;
    }
  }

  let content = "";

  if (hasAirIntersections && !hasLandIntersections) {
    const zone = air_intersections[0].zone || "UNKNOWN";
    content += TEXTS.CONTENT.AERIAL.generateContent(zone);
  } else if (hasLandIntersections && !hasAirIntersections) {
    content += TEXTS.CONTENT.LAND.generateContent(
      risk,
      flags.isMultiExposedSources
    );
  } else if (hasLandIntersections && hasAirIntersections) {
    content += TEXTS.CONTENT.MULTI.generateContent(risk);
  }

  return getSummaryIntroduction(risk) + content + getSummaryConclusion(risk);
};
