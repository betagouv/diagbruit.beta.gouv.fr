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
          <p className={fr.cx("fr-p-0")}>Parcelle</p>
        </div>
        <div className={classes.noticePerfectZone}>
          <span />
          <p className={fr.cx("fr-p-0")}>
            Position idéale du bâti selon diagBruit
          </p>
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
                    0.7
                  ),
                }}
              />
              <p>
                Bruit de niveau {getTextFromLegende(intersection.legende, true)}
              </p>
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
