import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import CardPreco from "../ui/CardPreco";
import useGetPrecosCards from "../../hooks/useGetPrecosCards";

export interface MostRecentPrecoProps {
    id: number;
    title: string;
    description: string
}


export const MostRecentPreco = ({ content }: { content: MostRecentPrecoProps }) => {
    const { cx, classes } = useStyles();
    const { precos: cards, isLoading } = useGetPrecosCards({
        "fields[0]": "title",
        "fields[1]": "slug",
        "populate[imageThumbnail][fields][0]": "url",
        "sort[0]": "createdAt:desc",
        "pagination[pageSize]": 3,
    });

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={cx(classes.titleContainer, "fr-col-12", "fr-grid-row")}>
                <img width={40} height={40} src="/images/precoIcon.svg" />
                <h2>{content.title}</h2>
            </div>
            <p>{content.description}</p>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-4v")}>
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={fr.cx("fr-col-12", "fr-col-md-4")}>
                            <div className={cx(classes.skeletonCard)} />
                        </div>
                    ))
                    : cards.map((c) => (
                        <div key={c.title} className={fr.cx("fr-col-12", "fr-col-sm-6", "fr-col-md-4")}>
                            <CardPreco title={c.title} imageUrl={c.imageUrl} slug={c.slug} />
                        </div>
                    ))
                }
            </div>
            <a href="/preco" className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right",)}>
                Consulter nos préconisations pour se protéger du bruit
            </a>
        </div>
    );
}

const useStyles = tss.withName(MostRecentPreco.name).create(() => ({
    titleContainer: {
        gap: fr.spacing("4v"),
    },
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
    },
    skeletonCard: {
        height: "280px",
        backgroundColor: fr.colors.decisions.background.contrast.grey.default,
        borderRadius: fr.spacing("1v"),
    }
}));

export default MostRecentPreco;