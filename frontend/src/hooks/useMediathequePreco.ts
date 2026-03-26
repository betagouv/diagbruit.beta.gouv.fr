import { RootNode } from "@strapi/blocks-react-renderer/dist/BlocksRenderer";
import axios from "axios";
import { useEffect, useState } from "react";

export interface MediathequePreco {
    id: number;
    documentId: string;
    title: string;
    slug: string;
    content: RootNode[];
    imageThumbnail: { url: string; alternativeText: string | null } | null;
    imageBanner: { url: string; alternativeText: string | null } | null;
    aRetenir: { id: number; text: string }[];
    keyPoints: { id: number; title: string; text: string }[];
    createdAt: string;
    updatedAt: string;
}

const useMediathequePreco = (slug: string) => {
    const [preco, setPreco] = useState<MediathequePreco | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setNotFound(false);
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/mediatheque-precos`, {
                params: {
                    populate: "*",
                    filters: { slug: { $eq: slug } },
                },
            })
            .then((res) => {
                const item = res.data.data[0] ?? null;
                if (!item) {
                    setNotFound(true);
                } else {
                    setPreco(item);
                }
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [slug]);

    return { preco, isLoading, notFound };
};

export default useMediathequePreco;
