import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { tss } from "tss-react/dsfr";
import { getReadableSource } from "../../utils/tools";
import type { SoundClassificationIntersection } from "../../utils/types";

type DiagnosticSoundClassificationTableProps = {
  intersections: SoundClassificationIntersection[];
  caption: string;
};

const DiagnosticSoundClassificationTable = ({
  intersections,
  caption,
}: DiagnosticSoundClassificationTableProps) => {
  const { cx, classes } = useStyles();

  const headers = [
    "Type de source",
    "Nom de la source",
    "Catégorie",
    "Distance minimum *",
    "Distance maximum *",
  ];

  const data = intersections
    .sort((a, b) => b.acoustic_category - a.acoustic_category)
    .map(
      ({
        kind,
        codeinfra,
        acoustic_category,
        min_distance,
        max_distance,
      }) => [
          getReadableSource(kind, true),
          codeinfra || "-",
          acoustic_category,
          `${min_distance.toString()} mètre${min_distance > 1 ? "s" : ""} *`,
          `${max_distance.toString()} mètre${max_distance > 1 ? "s" : ""} *`,
        ]
    );

  return (
    <Table
      className={cx(classes.tableContainer)}
      caption={caption}
      headers={headers}
      data={data}
      bordered
      fixed
    />
  );
};

const useStyles = tss.create(() => ({
  tableContainer: {
    margin: 0,
    paddingTop: fr.spacing("10v"),
    "& caption": {
      ...fr.typography[19].style,
      textDecoration: "underline",
    },
  },
}));

export default DiagnosticSoundClassificationTable;
