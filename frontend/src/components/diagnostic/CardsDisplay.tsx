import { tss } from "tss-react/dsfr";
import CardPreco, { CardPrecoProps } from "../ui/CardPreco";
import { fr } from "@codegouvfr/react-dsfr";


export const CardsDisplay = ({ Cards }: { Cards: CardPrecoProps[] }) => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.cardContainer)}>
            {Cards.map((c) => <CardPreco key={c.title} title={c.title} imageUrl={c.imageUrl} />)}
        </div>
    )
}

const useStyles = tss.withName(CardsDisplay.name).create(() => ({
    cardContainer: {
        display: "flex",
        gap: fr.spacing("2w"),
    },
}));
export default CardsDisplay;