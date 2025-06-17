import { Table } from "@codegouvfr/react-dsfr/Table";
import { getReadableSource } from "../../utils/tools";
import { SoundClassificationIntersection } from "../../utils/types";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

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
    "Distance",
  ];

  const data = intersections
    .sort((a, b) => b.sound_category - a.sound_category)
    .map(({ typesource, codeinfra, sound_category, distance }) => [
      getReadableSource(typesource, true),
      codeinfra || "-",
      sound_category,
      `${distance.toString()} mètre${distance > 1 ? "s" : ""}`,
    ]);

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
    },
  },
}));

export default DiagnosticSoundClassificationTable;
