import axios from "axios";
import { useEffect, useState } from "react";
import { imgUrl } from "../utils/tools";

type RecommendationCard = {
  title: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
};

export type PrecoCardData = {
  title: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
};

const usePrecosBySlugs = (slugs: string[]) => {
  const [precosBySlug, setPrecosBySlug] = useState<Record<string, PrecoCardData>>({});
  const [isLoading, setIsLoading] = useState(true);

  const validSlugs = slugs.filter(Boolean);
  const slugsKey = validSlugs.join(",");

  useEffect(() => {
    if (validSlugs.length === 0) {
      setPrecosBySlug({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams();
    validSlugs.forEach((slug) => params.append("slugs", slug));
    axios
      .get<RecommendationCard[]>(
        `${process.env.REACT_APP_API_URL}/recommendations/cards`,
        { params },
      )
      .then((res) => {
        if (cancelled) return;
        const bySlug: Record<string, PrecoCardData> = {};
        for (const card of res.data ?? []) {
          bySlug[card.slug] = {
            title: card.title,
            slug: card.slug,
            imageUrl: card.imageUrl ? imgUrl(card.imageUrl) : "",
            imageAlt: card.imageAlt,
          };
        }
        setPrecosBySlug(bySlug);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setPrecosBySlug({});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slugsKey]);

  return { precosBySlug, isLoading };
};

export default usePrecosBySlugs;
