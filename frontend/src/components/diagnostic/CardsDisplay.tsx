import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import CardPreco, { CardPrecoProps } from "../ui/CardPreco";


export const CardsDisplay = () => {
    const { cx, classes } = useStyles();
    const [cards, setCards] = useState<CardPrecoProps[]>([]);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
                params: {
                    "fields[0]": "title",
                    "fields[1]": "slug",
                    "populate[imageThumbnail][fields][0]": "url",
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
        <div className={cx(classes.cardContainer)}>
            {cards.map((c) => (
                <CardPreco key={c.title} title={c.title} imageUrl={c.imageUrl} slug={c.slug} />
            ))}
        </div>
    );
};

const useStyles = tss.withName(CardsDisplay.name).create(() => ({
    cardContainer: {
        display: "flex",
        gap: fr.spacing("2w"),
    },
}));

export default CardsDisplay;
