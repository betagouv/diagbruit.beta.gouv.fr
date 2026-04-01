import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import { fr } from "@codegouvfr/react-dsfr";
import DiagnosticParcelleSvgNotice from "../diagnostic/DiagnosticParcelleSvgNotice";
import DiagnosticParcelleSvg from "../diagnostic/DiagnosticParcelleSvg";

type SonoScorePreviewProps = {
    diagnosticItem: DiagnosticItem;
};

export const SolutionPreview = ({ diagnosticItem }: SonoScorePreviewProps) => {
    const { cx, classes } = useStyles();

    return (<div className={cx(classes.solutionContainer, "fr-col-8")}>
        <p className={cx(fr.cx("fr-text--lg", "fr-text--bold"))}>Position du bâti</p>
        <DiagnosticParcelleSvg geometry={diagnosticItem.parcelle.geometry} zones={diagnosticItem.diagnostic.zones} />
        <DiagnosticParcelleSvgNotice zones={diagnosticItem.diagnostic.zones} />
    </div>)
}

const useStyles = tss.withName(SolutionPreview.name).create(() => ({
    solutionContainer: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("6w")} auto`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
    },

}));


export default SolutionPreview;