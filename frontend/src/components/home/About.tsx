import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { Quote } from "@codegouvfr/react-dsfr/Quote";


export const About = () => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={cx(classes.quoteContainer)}>
                <h2>À propos</h2>
                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-col-12")}>
                    <div className="fr-col-6">
                        <Quote
                            author="Martin Schoreisz"
                            imageUrl="//www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.1x1.png"
                            size="xlarge"
                            source={"Chargé d'étude trafic et bruit chez Cerema"}
                            text="Notre ambission, rendre le cadre de vie des populations plus sain en les protégeant des risques sonores."
                        />
                    </div>
                    <div className={cx("fr-col-6", classes.textContainer)}>
                        <p
                        ><strong>
                                diagBruit</strong> est un <strong>service public de diagnostic bruit non opposable</strong> (à titre informatif),
                            co-construit avec les acteurs du terrain.
                            Il croise <strong>données nationales</strong> (classement sonore, PEB et dispositifs locaux CBS, PLU) pour <strong>évaluer l'environnement sonore</strong> de n'importe quelle parcelle.</p>
                    </div>
                </div>
            </div>
            <div className={cx(classes.partnersContainer)}>
                <p className={cx("fr-text--xl", "fr-text--bold")}>Merci à nos partenaires</p>
                <p className={cx("fr-text--lg")}>Cerema, DINUM, ANCT, DGPR, Nantes Métropole, Ville de Lille, Euro-Métropole de Strasbourg, Bordeaux métropole</p>
            </div>
        </div>
    )
}

const useStyles = tss.withName(About.name).create(() => ({
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
    },
    textContainer: {
        paddingLeft: `${fr.spacing("10w")} !important`,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
    },
    quoteContainer: {
        borderBottom: `1px solid #d9d9d9`,
        paddingBottom: fr.spacing("8w"),
        marginBottom: fr.spacing("8w"),
    },
    partnersContainer: {
        justifyContent: "center",
        alignItems: "center",
        display: "flex !important",
        flexDirection: "column",
    }

}));

export default About;