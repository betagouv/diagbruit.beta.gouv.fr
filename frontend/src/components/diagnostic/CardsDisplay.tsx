import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import CardPreco, { CardPrecoProps } from "../ui/CardPreco";
import useGetPrecosCards from "../../hooks/useGetPrecosCards";


export const CardsDisplay = () => {
    const { cx, classes } = useStyles();

    const { precos: cards } = useGetPrecosCards({
        "fields[0]": "title",
        "fields[1]": "slug",
        "populate[imageThumbnail][fields][0]": "url",
    });

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
