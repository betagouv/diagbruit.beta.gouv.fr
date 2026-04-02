import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";

export interface CardPrecoProps {
  title: string;
  imageUrl: string;
  slug: string;
}

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
      {cards.map((card) => (
        <Card
          enlargeLink
          imageAlt="texte alternatif de l’image"
          imageUrl={
            !!card.imageUrl
              ? card.imageUrl
              : "https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png"
          }
          linkProps={{
            href: `/preco/${card.slug}`,
            target: "_blank",
          }}
          size="medium"
          title={card.title}
          titleAs="h3"
        />
      ))}
    </div>
  );
};

const useStyles = tss.withName(CardsDisplay.name).create(() => ({
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: fr.spacing("2w"),
    [fr.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
}));

export default CardsDisplay;
