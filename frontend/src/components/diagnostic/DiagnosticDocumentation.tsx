import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { tss } from "tss-react/dsfr";
import { normalize } from "../../utils/tools";

export interface CardPrecoProps {
  title: string;
  imageUrl: string;
  slug: string;
}

export const DiagnosticDocumentation = () => {
  const { cx, classes } = useStyles();
  const [cards, setCards] = useState<CardPrecoProps[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
        params: {
          "fields[0]": "title",
          "fields[1]": "slug",
          "populate[imageThumbnail][fields][0]": "url",
          "pagination[pageSize]": 100,
          "sort[0]": "createdAt:desc",
        },
      })
      .then((res) => {
        const items: CardPrecoProps[] = res.data.data.map((item: any) => {
          const rawImageUrl = item.imageThumbnail?.url ?? "";
          const imageUrl =
            rawImageUrl.startsWith("/") && process.env.REACT_APP_CMS_URL
              ? `${process.env.REACT_APP_CMS_URL}${rawImageUrl}`
              : rawImageUrl;

          return {
            title: item.title,
            imageUrl,
            slug: item.slug,
          };
        });
        setCards(items);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const filteredCards = useMemo(() => {
    if (!search.trim()) return cards;
    const term = normalize(search.trim());
    return cards.filter((card) => normalize(card.title).includes(term));
  }, [cards, search]);

  return (
    <div>
      <div className={cx(classes.searchContainer)}>
        <SearchBar
          label="Rechercher"
          renderInput={({ className, id, placeholder, type }) => (
            <input
              className={className}
              id={id}
              placeholder={placeholder}
              type={type}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          allowEmptySearch
          onButtonClick={setSearch}
        />
      </div>
      {filteredCards.length === 0 ? (
        <p className={cx(classes.emptyState)}>
          Aucune préconisation ne semble correspondre à votre recherche.
        </p>
      ) : (
        <div className={cx(classes.cardContainer)}>
          {filteredCards.map((card) => (
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
      )}
    </div>
  );
};

const useStyles = tss.withName(DiagnosticDocumentation.name).create(() => ({
  searchContainer: {
    marginBottom: fr.spacing("3w"),
    maxWidth: 350,
  },
  emptyState: {
    textAlign: "center",
    color: fr.colors.decisions.text.mention.grey.default,
    marginTop: fr.spacing("8w"),
  },
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: fr.spacing("2w"),
    [fr.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
}));

export default DiagnosticDocumentation;
