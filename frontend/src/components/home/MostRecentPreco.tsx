import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import CardPreco from "../ui/CardPreco";
import useGetPrecosCards from "../../hooks/useGetPrecosCards";

export const MostRecentPreco = () => {
    const { cx, classes } = useStyles();
    const { precos: cards } = useGetPrecosCards({
        "fields[0]": "title",
        "fields[1]": "slug",
        "populate[imageThumbnail][fields][0]": "url",
        "sort[0]": "createdAt:desc",
        "pagination[pageSize]": 3,
    });

    return (
        <div className={cx(classes.contentContainer)}>
            <h1>Des solutions pour se protéger du bruit</h1>
            <p>Conseils, informations techniques et bonnes pratiques vulgarisées :
                notre médiathèque de préconisations vous aide à anticiper les risques sonores et à
                protéger la santé des futurs résidents dès la phase de conception.</p>
            <div className={cx(classes.cardContainer)}>
                {cards.map((c) => (
                    <CardPreco key={c.title} title={c.title} imageUrl={c.imageUrl} slug={c.slug} />
                ))}
            </div>
            <a href="/preco" className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right",)}>
                Consulter nos préconisations pour se protéger du bruit
            </a>
        </div>
    );
}

const useStyles = tss.withName(MostRecentPreco.name).create(() => ({
    cardContainer: {
        display: "flex",
        gap: fr.spacing("2w"),
        paddingBottom: fr.spacing("4v"),
    },
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
    }
}));

export default MostRecentPreco;