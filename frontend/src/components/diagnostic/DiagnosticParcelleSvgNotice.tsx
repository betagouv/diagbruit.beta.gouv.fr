import { fr } from "@codegouvfr/react-dsfr";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { tss } from "tss-react/dsfr";
import {
  getColorFromRisk,
  getTextFromRisk,
  transparentize,
} from "../../utils/tools";
import type { Zone } from "../../utils/types";

type DiagnosticParcelleSvgNoticeProps = {
  zones: Zone[];
};

const DiagnosticParcelleSvgNotice = ({
  zones,
}: DiagnosticParcelleSvgNoticeProps) => {
  const { classes, cx } = useStyles();

  return (
    <div className={cx("fr-container", classes.container)}>
      <h3>LÉGENDE</h3>
      <div className={classes.noticeContainer}>
        <div className={classes.noticeParcelle}>
          <span />
          <div className={fr.cx("fr-text--md")}>Parcelle</div>
        </div>
        <div className={classes.noticePerfectZone}>
          <span />
          <div className={fr.cx("fr-text--md")}>
            Zone idéale du bâti selon diagBruit
          </div>
        </div>
        {Array.from(
          new Map(
            zones.map((zone) => [getColorFromRisk(zone.risk), zone])
          ).values()
        )
          .sort((a, b) => a.risk - b.risk)
          .map((zone, index) => (
            <div
              className={classes.noticeIntersection}
              key={`interesection-${index}`}
            >
              <span
                style={{
                  backgroundColor: transparentize(
                    getColorFromRisk(zone.risk),
                    0.8,
                    false
                  ),
                }}
              />
              <div className={fr.cx("fr-text--md")}>
                Risque de niveau {getTextFromRisk(zone.risk, true)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    h3: {
      ...fr.typography[6].style,
      color: fr.colors.decisions.background.flat.blueFrance.default
    },
    "& .fr-text--md": {
      margin: "0 !important",
    },
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    padding: fr.spacing("6v"),
  },
  noticeContainer: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("2v"),
  },
  noticeParcelle: {
    display: "flex",
    alignItems: "center",
    span: {
      display: "block",
      width: fr.spacing("8v"),
      height: fr.spacing("8v"),
      marginRight: fr.spacing("2v"),
      backgroundColor: fr.colors.decisions.background.default.grey.default,
      border: `2px solid ${fr.colors.decisions.background.flat.blueFrance.default}`,
    },
  },
  noticePerfectZone: {
    display: "flex",
    alignItems: "center",
    span: {
      display: "block",
      width: fr.spacing("8v"),
      height: fr.spacing("8v"),
      marginRight: fr.spacing("2v"),
      backgroundColor: fr.colors.decisions.background.default.grey.default,
      backgroundImage: `radial-gradient(${fr.colors.decisions.background.flat.blueFrance.default} 1.5px, transparent 1.5px)`,
      backgroundSize: "6px 6px",
      backgroundRepeat: "repeat",
      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    },
  },
  noticeIntersection: {
    display: "flex",
    alignItems: "center",
    span: {
      display: "block",
      width: fr.spacing("8v"),
      height: fr.spacing("8v"),
      marginRight: fr.spacing("2v"),
      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    },
  },
}));

export default DiagnosticParcelleSvgNotice;
