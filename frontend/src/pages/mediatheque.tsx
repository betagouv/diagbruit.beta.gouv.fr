import { fr } from "@codegouvfr/react-dsfr";
import { Summary } from "@codegouvfr/react-dsfr/Summary";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { useParams } from "react-router-dom";
import { Loader } from "../components/ui/Loader";
import useMediathequePreco from "../hooks/useMediathequePreco";
import { tss } from "tss-react/dsfr";

const toAnchorId = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const MediathequePage = () => {
    const { classes, cx } = useStyles();

    const { slug } = useParams<{ slug: string }>();
    const { preco, isLoading, notFound } = useMediathequePreco(slug ?? "");

    if (isLoading) {
        return (
            <div className={fr.cx("fr-my-16w")}>
                <Loader />
            </div>
        );
    }

    if (notFound || !preco) {
        return (
            <div className={fr.cx("fr-container", "fr-my-10v")}>
                <p>Préconisation introuvable.</p>
            </div>
        );
    }

    const h2Links = preco.content
        .filter((block: any) => block.type === "heading" && block.level === 2)
        .map((block: any) => {
            const text = block.children.map((c: any) => c.text).join("");
            return {
                text,
                linkProps: { href: `#${toAnchorId(text)}` },
            };
        });

    return (
        <>
            {preco.imageBanner && (
                <img
                    className={cx(classes.imageBanner)}
                    src={`${process.env.REACT_APP_CMS_URL}${preco.imageBanner.url}`}
                    alt={preco.imageBanner.alternativeText ?? preco.title}
                />
            )}
            <div className={fr.cx("fr-container", "fr-my-10v", "fr-col-12")}>
                <h1>{preco.title}</h1>
                <p>Dernière mise à jour le {new Date(preco.updatedAt).toLocaleDateString("fr-FR")}</p>

                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                    <div className="fr-col-3">
                        {h2Links.length > 0 && (
                            <Summary links={h2Links} />
                        )}
                    </div>
                    <div className="fr-col-9">
                        <BlocksRenderer
                            content={preco.content}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

const useStyles = tss.withName(MediathequePage.name).create(() => ({
    imageBanner: {
        width: "100%",
        height: "240px",
        objectFit: "cover",
        display: "block",
    },
}));

export default MediathequePage;
