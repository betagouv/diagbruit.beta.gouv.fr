
export const dsfr = {
  colors: {
    blueFrance: "#000091", // --blue-france-sun-113-625 (primary action/title)
    contrastBlueFrance: "#e3e3fd", // --background-contrast-blue-france (light callout bg)
    titleGrey: "#161616", // --text-title-grey
    defaultGrey: "#3a3a3a", // --text-default-grey
    mentionGrey: "#666666", // --text-mention-grey
    disabledGrey: "#929292", // --text-disabled-grey
    borderGrey: "#dddddd", // --border-default-grey
  },
  spacing: (units: number) => units * 4, // "Xv" → px
  fontSize: {
    xxs: 8, // fr-text--xs  (0.75rem)
    xs: 12, // fr-text--xs  (0.75rem)
    sm: 14, // fr-text--sm  (0.875rem)
    md: 16, // fr-text--lg  (1.125rem)
    lg: 18, // fr-text--lg  (1.125rem)
    h4: 24, // fr-h3
    h3: 28, // fr-h3
    h2: 32, // fr-h2
  },
} as const;
