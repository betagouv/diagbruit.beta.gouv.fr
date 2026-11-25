import { Card } from "@codegouvfr/react-dsfr/Card";
import type { ReactNode } from "react";
import { tss } from "tss-react/dsfr";

export interface CardPrecoProps {
  title: string;
  imageUrl: string;
  slug: string;
  target?: boolean;
  horizontal?: boolean;
  start?: ReactNode;
  imageAlt?: string;
  titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";
}

const useStyles = tss.withName("CardPreco").create(() => ({
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
  },
  horizontalCard: {
    "& .fr-card__img": {
      aspectRatio: "auto",
    },
  },
}));

export const CardPreco = ({
  title,
  imageUrl,
  slug,
  target = false,
  horizontal = false,
  start,
  imageAlt = "texte alternatif de l’image",
  titleAs = "h3",
}: CardPrecoProps) => {
  const { cx, classes } = useStyles();

  const cardProps = {
    className: cx(classes.card, horizontal && classes.horizontalCard),
    start,
    enlargeLink: true as const,
    imageAlt,
    imageUrl: !!imageUrl ? imageUrl : "/images/imgPlaceholder.png",
    linkProps: {
      href: `/preco/${slug}`,
      target: target ? "_blank" : undefined,
    },
    size: horizontal ? ("small" as const) : ("medium" as const),
    title,
    titleAs,
  };

  // Card's types only accept `ratio` with `horizontal: true`, hence two branches.
  return (
    <div className={cx(classes.cardContainer)}>
      {horizontal ? (
        <Card {...cardProps} horizontal ratio="33/66" />
      ) : (
        <Card {...cardProps} />
      )}
    </div>
  );
};



export default CardPreco;
