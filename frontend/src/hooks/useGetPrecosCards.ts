import axios from "axios";
import { useEffect, useState } from "react";
import { CardPrecoProps } from "../components/ui/CardPreco";

const useGetPrecosCards = (params: Record<string, string | number>) => {
    const [precos, setPrecos] = useState<CardPrecoProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, { params })
            .then((res) => {
                const items: CardPrecoProps[] = res.data.data.map((item: any) => ({
                    title: item.title,
                    imageUrl: item.imageThumbnail?.url
                        ? `${process.env.REACT_APP_CMS_URL}${item.imageThumbnail.url}`
                        : "",
                    slug: item.slug,
                }));
                setPrecos(items);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [JSON.stringify(params)]);

    return { precos, isLoading };
};

export default useGetPrecosCards;
