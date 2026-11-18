import axios from "axios";
import { useEffect, useState } from "react";
import { imgUrl } from "../utils/tools";

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
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
        params: {
          fields: ["title", "slug"],
          populate: ["imageThumbnail"],
          filters: { slug: { $in: validSlugs } },
        },
      })
      .then((res) => {
        if (cancelled) return;
        const bySlug: Record<string, PrecoCardData> = {};
        for (const item of res.data.data ?? []) {
          bySlug[item.slug] = {
            title: item.title,
            slug: item.slug,
            imageUrl: item.imageThumbnail?.url ? imgUrl(item.imageThumbnail.url) : "",
            imageAlt: item.imageThumbnail?.alternativeText ?? "",
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
