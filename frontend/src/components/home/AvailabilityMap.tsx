import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

export interface AvailabilityMapProps {
    title: string;
    textContent: string;
}

const useStyles = tss.withName("AvailabilityMap").create(() => ({
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
    },
    imageContainer: {
        marginTop: fr.spacing('4v'),
        [fr.breakpoints.up("md")]: {
            marginTop: 0,
        },
    },
    mapImage: {
        width: "100%",
        height: "auto",
    }
}));

export const AvailabilityMap = ({ content }: { content: AvailabilityMapProps }) => {
    const { cx, classes } = useStyles();

    const parser = new DOMParser();
    const doc = parser.parseFromString(content.textContent, "text/html");
    const text = doc.body.innerHTML;

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
                    <h2>{content.title}</h2>
                    <div
                        className={cx(classes.textContent)}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                </div>
                <div className={cx(classes.imageContainer, "fr-col-12", "fr-col-md-6")}>
                    <img
                        src="/images/carte_france_regionale.svg"
                        alt="title icon"
                        width={450}
                        height={392}
                        className={cx(classes.mapImage)}
                        fetchPriority="high"
                    />
                </div>
            </div>
        </div>
    )
}

export default AvailabilityMap;