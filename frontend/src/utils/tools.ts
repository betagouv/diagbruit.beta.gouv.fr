import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";

export const getRiskFromScore = (score: number) => {
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
