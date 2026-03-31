import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

export interface AvailabilityMapProps {
    title: string;
    textContent: string;
}

export const AvailabilityMap = ({ content }: { content: AvailabilityMapProps }) => {
    const { cx, classes } = useStyles();

    const parser = new DOMParser();
    const doc = parser.parseFromString(content.textContent, "text/html");
    const text = doc.body.innerHTML;

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className="fr-col-6">
                    <h1>{content.title}</h1>
                    <div
                        className={cx(classes.textContent)}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                    <a href="#" className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right",)}>
                        Consulter nos statistiques
                    </a>
                </div>
                <div className="fr-col-6">
                    <img src="/images/carte_france_regionale.svg" alt="title icon" />
                </div>
            </div>
        </div>
    )
}

const useStyles = tss.withName(AvailabilityMap.name).create(() => ({
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        borderBottom: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
    },
    textContent: {
        a: {
            color: fr.colors.decisions.background.flat.blueFrance.default,
        }
    }
}));

export default AvailabilityMap;