import { fr } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import { tss } from 'tss-react/dsfr';

export default function DiagnosticDesignOffice() {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.container)}>
            <Badge severity="info">
                Conseil
            </Badge>
            <div className={"fr-grid-row"}>
                <div className={cx(classes.imgContainer, "fr-col-12", "fr-col-md-1")}>
                    <img src="/images/Support.svg" alt="Annuaire bureau d'étude icon" />
                </div>
                <ul className={cx(classes.list)}>
                    <li>
                        <strong>Rendez-vous sur place</strong> afin d'évaluer l'environnement sonore en fonction de vos usages et de votre sensibilité au bruit.
                    </li>
                    <li>
                        <strong>Faites appel à un acousticien certifié ou à un bureau d'études spécialisé</strong> avant le dépôt du permis de construire pour garantir la conformité réglementaire de votre projet et protéger la santé et le confort de vos futurs résidents.
                    </li>
                    <li className={cx(classes.linkItem)}>
                        <a href="/preco/bureau-etudes-acoustiques" className={cx(classes.link)}>
                            Consultez les annuaires de bureaux d'études acoustiques
                            <i className={fr.cx("ri-arrow-right-line", "fr-pl-1v")} />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    )
}

const useStyles = tss.create(() => ({
    container: {
        marginTop: fr.spacing("4v"),
        border: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        padding: fr.spacing("6v"),
    },
    imgContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    list: {
        flex: "1 1 100%",
        minWidth: 0,
        [fr.breakpoints.up('md')]: {
            flex: "1 1 0",
            marginBottom: 0,
            marginLeft: fr.spacing("4v"),
        },
        marginLeft: fr.spacing("2v"),
    },
    linkItem: {
        // DSFR dessine une puce native (list-style-type: var(--ul-type))
        listStyleType: "none",
    },
    link: {
        color: fr.colors.decisions.text.actionHigh.blueFrance.default,
        "i::before": {
            "--icon-size": fr.typography[19].style.fontSize,
        },
    }
}));