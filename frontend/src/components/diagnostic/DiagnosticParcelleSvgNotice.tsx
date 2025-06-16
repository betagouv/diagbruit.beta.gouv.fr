import { fr } from "@codegouvfr/react-dsfr";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { tss } from "tss-react/dsfr";
import {
  getColorFromLegende,
  getTextFromLegende,
  transparentize,
} from "../../utils/tools";
import { LandIntersection } from "../../utils/types";

type DiagnosticParcelleSvgNoticeProps = {
  intersections: LandIntersection[];
};

const DiagnosticParcelleSvgNotice = ({
  intersections,
}: DiagnosticParcelleSvgNoticeProps) => {
  const { classes } = useStyles();

  return (
    <CallOut title="Légende" className={classes.callOutContainer}>
      <div className={classes.noticeContainer}>
        <div className={classes.noticeParcelle}>
          <span />
          <div className={fr.cx("fr-text--md")}>Parcelle</div>
        </div>
        <div className={classes.noticePerfectPoint}>
          <span />
          <div className={fr.cx("fr-text--md")}>
            Point où le risque est le plus faible
          </div>
        </div>
        <div className={classes.noticePerfectZone}>
          <span />
          <div className={fr.cx("fr-text--md")}>
            Position idéale du bâti selon diagBruit
          </div>
        </div>
        {Array.from(
          new Map(
            intersections.map((item) => [
              getColorFromLegende(item.legende),
              item,
            ])
          ).values()
        )
          .sort((a, b) => a.legende - b.legende)
          .map((intersection, index) => (
            <div
              className={classes.noticeIntersection}
              key={`interesection-${index}`}
            >
              <span
                style={{
                  backgroundColor: transparentize(
                    getColorFromLegende(intersection.legende),
                    0.8,
                    false
                  ),
                }}
              />
              <div className={fr.cx("fr-text--md")}>
                Risque de niveau{" "}
                {getTextFromLegende(intersection.legende, true)}
              </div>
            </div>
          ))}
      </div>
    </CallOut>
  );
};

const useStyles = tss.create(() => ({
  callOutContainer: {
    h3: {
      ...fr.typography[0].style,
      marginBottom: fr.spacing("4v"),
    },
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
  noticePerfectPoint: {
    display: "flex",
    alignItems: "center",
    span: {
      display: "block",
      width: fr.spacing("8v"),
      height: fr.spacing("8v"),
      marginRight: fr.spacing("2v"),
      backgroundColor: fr.colors.decisions.background.default.grey.default,
      backgroundImage: `radial-gradient(${fr.colors.decisions.border.default.purpleGlycine.default} 6px, transparent 6px)`,
      backgroundSize: "12px 12px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
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
