import { Card } from "@codegouvfr/react-dsfr/Card";
import { tss } from "tss-react/dsfr";

export interface CardPrecoProps {
  title: string;
  imageUrl: string;
  slug: string;
  target?: boolean;
}

export const CardPreco = ({ title, imageUrl, slug, target = false }: CardPrecoProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.cardContainer)}>
      <Card
        className={cx(classes.card)}
        enlargeLink
        imageAlt="texte alternatif de l’image"
        imageUrl={
          !!imageUrl
            ? imageUrl
            : "https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png"
        }
        linkProps={{
          href: `/preco/${slug}`,
          target: target ? "_blank" : undefined,
        }}
        size="medium"
        title={title}
        titleAs="h3"
      />
    </div>
  );
};

const useStyles = tss.withName(CardPreco.name).create(() => ({
  cardContainer: {
    display: "flex",
    height: "100%"
  },
  card: {
    width: "100%",
    "& .fr-card__img": {
      aspectRatio: "16/9",
      overflow: "hidden",
    },
    "& .fr-card__img img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
  }
}));

export default CardPreco;
