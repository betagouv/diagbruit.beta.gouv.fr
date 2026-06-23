import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";

const DiagnosticAcousticCertificate = () => {
    const { cx, classes } = useStyles();

    const [content, setContent] = useState<any>(null);
    const [recommendation, setRecommendation] = useState<any>(null);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/acoustic-certificate`)
            .then((res) => {
                setContent(res.data.data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    useEffect(() => {
        if (!content?.cardSlug) return;
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
                params: {
                    populate: "*",
                    filters: { slug: { $eq: content.cardSlug } },
                },
            })
            .then((res) => {
                setRecommendation(res.data.data[0] ?? null);
                console.log("recommendation", res.data.data[0] ?? null);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [content?.cardSlug]);

    if (!content) {
        return <></>;
    }

    return (<div className={fr.cx("fr-mb-4v")}>
        {content.content && (
            <>
                <h4 className={fr.cx("fr-h6", "fr-mb-3v")}>Concernant votre projet</h4>
                <Accordion
                    titleAs="h3"
                    label={
                        <>
                            <i className={fr.cx("fr-mr-1v", "fr-icon-checkbox-circle-line")} />
                            Attestation acoustique
                        </>
                    }
                >
                    <div dangerouslySetInnerHTML={{ __html: content.content }}></div>
                    {recommendation && (
                        <Card
                            background
                            border
                            enlargeLink
                            horizontal
                            imageAlt={recommendation.imageBanner?.alternativeText ?? ""}
                            imageUrl={`${process.env.REACT_APP_CMS_URL}${recommendation.imageBanner.url}`}
                            linkProps={{
                                href: `/preco/${recommendation.slug}`,
                                target: "_blank",
                            }}
                            size="large"
                            start={<ul className="fr-badges-group"><li><Badge className={cx(classes.badge)}>Article</Badge></li></ul>}
                            title={recommendation.title}
                            titleAs="h3"
                        />
                    )}
                </Accordion>
            </>
        )}
    </div>)
}

const useStyles = tss.create(() => ({
    badge: {
    }
}));

export default DiagnosticAcousticCertificate;