import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { tss } from "tss-react/dsfr";
import { getLandIntersectionIsolation } from "../../utils/isolation";
import { noiseTableData, noiseTableHeaders } from "../../utils/noisetable";
import {
  SoundClassificationIntersection,
  SoundClassificationIntersectionAffectedHelper,
} from "../../utils/types";

type DiagnosticInfrastructureNoiseTableProps = {
  intersectionsHelper:
    | SoundClassificationIntersection[]
    | SoundClassificationIntersectionAffectedHelper[];
  caption?: string;
  color?: string;
};

type TableCellProps = {
  cellIndex: number;
  categoryIndex: number;
  cell: string;
  isHeader: boolean;
};

const isAffectedHelperArray = (
  arr:
    | SoundClassificationIntersection[]
    | SoundClassificationIntersectionAffectedHelper[]
): arr is SoundClassificationIntersectionAffectedHelper[] => {
  return Array.isArray(arr) && arr.length > 0 && "intersection" in arr[0];
};

const DiagnosticInfrastructureNoiseTable = ({
  intersectionsHelper,
  caption,
  color,
}: DiagnosticInfrastructureNoiseTableProps) => {
  const { cx, classes } = useStyles({ hasCaption: !!caption });

  const usableIntersectionsHelper: SoundClassificationIntersectionAffectedHelper[] =
    isAffectedHelperArray(intersectionsHelper)
      ? intersectionsHelper
      : intersectionsHelper.map((intersection) => ({
          intersection,
          doesAffectOptimalZone: true,
          preciseDistance: intersection.distance,
          isolation: getLandIntersectionIsolation(
            intersection.sound_category,
            intersection.distance
          ),
        }));

  const getDistanceFromHelper = (
    helper: SoundClassificationIntersectionAffectedHelper
  ) => {
    return helper.preciseDistance && helper.doesAffectOptimalZone
      ? helper.preciseDistance
      : helper.intersection.distance;
  };

  const CellContainer = ({
    isConcerned,
    isLegacy,
    intersectionsHelpersMatch,
    children,
  }: {
    isConcerned: boolean;
    isLegacy: boolean;
    intersectionsHelpersMatch: SoundClassificationIntersectionAffectedHelper[];
    children: React.ReactNode;
  }) => {
    if (!isConcerned) return <>{children}</>;

    return (
      <Tooltip
        kind="hover"
        title={
          <div style={{ textAlign: isLegacy ? "center" : "left" }}>
            {isLegacy && <>Non concerné avec cette position du bâti</>}
            <div
              style={{
                textDecoration: isLegacy ? "line-through" : "initial",
              }}
            >
              {intersectionsHelpersMatch
                .map(
                  (helper) =>
                    `${helper.intersection.codeinfra} à ${getDistanceFromHelper(
                      helper
                    )}m`
                )
                .join(", ")}
            </div>
          </div>
        }
      >
        {children}
      </Tooltip>
    );
  };

  const TableCell = ({
    cellIndex,
    categoryIndex,
    cell,
    isHeader,
  }: TableCellProps) => {
    const currentDistance =
      parseInt((noiseTableHeaders[cellIndex] || "").split(" ")[0]) || 0;
    const nextDistance =
      parseInt((noiseTableHeaders[cellIndex + 1] || "").split(" ")[0]) ||
      Infinity;

    const intersectionsHelperMatch = usableIntersectionsHelper.filter(
      (helper) => {
        const distance = getDistanceFromHelper(helper);
        return (
          helper.intersection.sound_category === categoryIndex &&
          (distance >= currentDistance ||
            (cellIndex === 1 && distance <= 10)) &&
          distance < nextDistance
        );
      }
    );

    const isConcerned = !!intersectionsHelperMatch.length && !isHeader;
    const isLegacy =
      isConcerned &&
      intersectionsHelperMatch.every((helper) => !helper.doesAffectOptimalZone);

    let backgroundColor = "initial";

    if (isConcerned) {
      backgroundColor =
        color || fr.colors.decisions.background.actionHigh.greenArchipel.active;
    }

    if (isLegacy) {
      backgroundColor = fr.colors.decisions.background.actionHigh.grey.active;
    }

    return (
      <td
        {...(isHeader
          ? { scope: "row", className: cx(classes.headerCell) }
          : {})}
      >
        <CellContainer
          isConcerned={isConcerned}
          isLegacy={isLegacy}
          intersectionsHelpersMatch={intersectionsHelperMatch}
        >
          <div
            style={{
              backgroundColor,
              color: isConcerned ? "white" : "initial",
              fontWeight: isConcerned ? "bold" : "inherit",
              borderRadius: fr.spacing("1v"),
            }}
          >
            {cell}
          </div>
        </CellContainer>
      </td>
    );
  };

  return (
    <div
      className={cx(
        fr.cx("fr-table", "fr-table--bordered", "fr-table--layout-fixed"),
        classes.tableContainer
      )}
      data-fr-js-table="true"
    >
      <table data-fr-js-table-element="true">
        {caption && (
          <caption data-fr-js-table-caption="true">{caption}</caption>
        )}
        <thead>
          <tr>
            {noiseTableHeaders.map((header, i) => (
              <th key={i} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {noiseTableData.map((row, rowIndex) => (
            <tr key={rowIndex} data-fr-js-table-row="true">
              {row.map((cell, cellIndex) => (
                <TableCell
                  key={`${rowIndex}-${cellIndex}`}
                  cellIndex={cellIndex}
                  categoryIndex={rowIndex + 1}
                  cell={cell}
                  isHeader={cellIndex === 0}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const useStyles = tss
  .withParams<{ hasCaption: boolean }>()
  .create(({ hasCaption }) => ({
    tableContainer: {
      margin: 0,
      paddingTop: hasCaption ? fr.spacing("10v") : fr.spacing("2v"),
      "--table-offset": "calc(32px + 1rem)",
      "& > table th, & > table td": {
        ...fr.typography[17].style,
        whiteSpace: "nowrap",
        textAlign: "center",
      },
      "& caption": {
        ...fr.typography[19].style,
        textDecoration: "underline",
      },
    },
    headerCell: {
      fontWeight: "bold",
      backgroundColor: fr.colors.decisions.background.alt.grey.default,
      backgroundSize: "1px 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right",
      backgroundImage: `linear-gradient(0deg, ${fr.colors.decisions.border.plain.grey.default}, ${fr.colors.decisions.border.plain.grey.default})`,
    },
  }));

export default DiagnosticInfrastructureNoiseTable;
