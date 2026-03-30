import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import CardPreco, { CardPrecoProps } from "../ui/CardPreco";
import { useEffect, useState } from "react";
import axios from "axios";

export const MostRecentPreco = () => {
    const { cx, classes } = useStyles();
    const [cards, setCards] = useState<CardPrecoProps[]>([]);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
                params: {
                    "fields[0]": "title",
                    "fields[1]": "slug",
                    "populate[imageThumbnail][fields][0]": "url",
                    "sort[0]": "createdAt:desc",
                    "pagination[pageSize]": 3,
                },

            })
            .then((res) => {
                const items: CardPrecoProps[] = res.data.data.map((item: any) => ({
                    title: item.title,
                    imageUrl: item.imageThumbnail?.url
                        ? `${process.env.REACT_APP_CMS_URL}${item.imageThumbnail.url}`
                        : "",
                    slug: item.slug,
                }));
                setCards(items);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

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
            <a href="/preco" className={fr.cx("fr-link")}>Consulter nos préconisations pour se protéger du bruit </a>
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
        borderTop: "0.5px solid #DDDDDD",
        borderBottom: "0.5px solid #DDDDDD",
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
    }
}));

export default MostRecentPreco;