import { encode } from "./compression";

const EXCLUSIVE_PARAMS = [
  "parcelle",
  "address",
  "parcelleSearch",
  "insee_com",
  "section",
  "prefixe",
  "numero",
] as const;

export type DiagnosticSearchParam = (typeof EXCLUSIVE_PARAMS)[number];

export function buildExclusiveDiagnosticSearch(
  param: DiagnosticSearchParam,
  value: unknown,
  initialSearch: string = "",
): URLSearchParams {
  const params = new URLSearchParams(initialSearch);
  for (const key of EXCLUSIVE_PARAMS) {
    params.delete(key);
  }
  params.set(param, encode(value));
  return params;
}
