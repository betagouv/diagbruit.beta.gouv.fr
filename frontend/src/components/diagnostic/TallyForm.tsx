import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

export const TallyForm = () => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={cx("fr-card", "fr-p-4v")}>
                <iframe
                    data-tally-src="https://tally.so/embed/1A4kZL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                    width="100%"
                    height={275}
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    title="Votre avis sur diagBruit"
                />
            </div>
        </div>
    )
}

const useStyles = tss.withName(TallyForm.name).create(() => ({
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,

    },
}));

export default TallyForm;