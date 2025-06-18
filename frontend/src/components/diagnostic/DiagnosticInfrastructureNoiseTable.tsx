import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { noiseTableData, noiseTableHeaders } from "../../utils/noisetable";
import { SoundClassificationIntersection } from "../../utils/types";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

type DiagnosticInfrastructureNoiseTableProps = {
  intersections: SoundClassificationIntersection[];
  caption?: string;
  color?: string;
};

type TableCellProps = {
  cellIndex: number;
  categoryIndex: number;
  cell: string;
  isHeader: boolean;
};

const DiagnosticInfrastructureNoiseTable = ({
  intersections,
  caption,
  color,
}: DiagnosticInfrastructureNoiseTableProps) => {
  const { cx, classes } = useStyles({ hasCaption: !!caption });

  const CellContainer = ({
    isConcerned,
    intersectionsMatch,
    children,
  }: {
    isConcerned: boolean;
    intersectionsMatch: SoundClassificationIntersection[];
    children: React.ReactNode;
  }) => {
    if (!isConcerned) return <>{children}</>;

    return (
      <Tooltip
        kind="hover"
        title={intersectionsMatch
          .map(
            (intersection) =>
              `${intersection.codeinfra} à ${intersection.distance}m`
          )
          .join(", ")}
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
    const previousDistance =
      parseInt((noiseTableHeaders[cellIndex - 1] || "").split(" ")[0]) || 0;

    const intersectionsMatch = intersections.filter(
      (intersection) =>
        intersection.sound_category === categoryIndex &&
        intersection.distance < currentDistance &&
        intersection.distance >= previousDistance
    );

    const isConcerned = !!intersectionsMatch.length && !isHeader;

    return (
      <td
        {...(isHeader
          ? { scope: "row", className: cx(classes.headerCell) }
          : {})}
      >
        <CellContainer
          isConcerned={isConcerned}
          intersectionsMatch={intersectionsMatch}
        >
          <div
            style={{
              backgroundColor: isConcerned
                ? color ||
                  fr.colors.decisions.background.actionHigh.greenArchipel.active
                : "initial",
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
