import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

export const AvailabilityMap = () => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className="fr-col-6">
                    <h1>Carte de disponibilité du diagnostic de bruit</h1>
                    <p>diagbruit croise données nationales pour évaluer l'environnement sonore.
                        Ces données sont disponible dans 5 départements, dont les villes de <strong>Bordeaux, Strasbourg, Rennes, Lille et Nantes.</strong>
                    </p>
                    <p>
                        <strong>
                            Ouvertures prochaines : Marseille et Nîmes
                        </strong>
                    </p>
                    <p>
                        Vous aimeriez diagbruit dans votre ville ? <a href="#" className={fr.cx("fr-link")} >
                            Dites-le-nous
                        </a>
                    </p>
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
    }
}));

export default AvailabilityMap;