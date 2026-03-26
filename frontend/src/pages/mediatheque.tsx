import { fr } from "@codegouvfr/react-dsfr";
import { Summary } from "@codegouvfr/react-dsfr/Summary";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import React from "react";
import { useParams } from "react-router-dom";
import { Loader } from "../components/ui/Loader";
import useMediathequePreco from "../hooks/useMediathequePreco";
import { tss } from "tss-react/dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CheckText, CheckTexts } from "../components/utils/CheckTexts";
import Card from "@codegouvfr/react-dsfr/Card";
import Badge from "@codegouvfr/react-dsfr/Badge";

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

    const keyPointsTitle = "1. Les 4 points clés avant installation";

    const h2Links = [
        ...(preco.keyPoints?.length > 0
            ? [{ text: keyPointsTitle, linkProps: { href: `#${toAnchorId(keyPointsTitle)}` } }]
            : []),
        ...preco.content
            .filter((block: any) => block.type === "heading" && block.level === 2)
            .map((block: any) => {
                const text = block.children.map((c: any) => c.text).join("");
                return { text, linkProps: { href: `#${toAnchorId(text)}` } };
            }),
    ];

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
                        {preco.aRetenir && (
                            <Alert
                                className={fr.cx("fr-mb-4v")}
                                title="À retenir"
                                description={
                                    preco.aRetenir.map((e) => (
                                        <div className={cx("fr-grid-row")}>
                                            <CheckText text={e.text} />
                                        </div>
                                    ))
                                }
                                onClose={function noRefCheck() { }}
                                severity="info"
                                small
                            />
                        )}
                        {preco.keyPoints && (
                            <>
                                <h2 id={toAnchorId(keyPointsTitle)}>{keyPointsTitle}</h2>
                                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-4v")}>
                                    {preco.keyPoints.map((k, index) => (
                                        <div className={fr.cx("fr-col-4")}>
                                            <Card
                                                border
                                                desc={k.text}
                                                size="medium"
                                                title={k.title}
                                                titleAs="h3"
                                                start={<ul className="fr-badges-group"><li><Badge>Point n°{index + 1}</Badge></li></ul>}

                                            />
                                        </div>
                                    ))}
                                </div></>
                        )}
                        <BlocksRenderer
                            content={preco.content}
                            blocks={{
                                heading: ({ children, level }) => {
                                    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
                                    const id = level === 2
                                        ? toAnchorId(
                                            React.Children.toArray(children)
                                                .map((c: any) => c.props?.text ?? "")
                                                .join("")
                                        )
                                        : undefined;
                                    return <Tag id={id}>{children}</Tag>;
                                },
                            }}
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
