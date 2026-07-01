import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { PrecoProps } from "../../hooks/usePreco";
import { imgUrl } from "../../utils/tools";

type AcoustiCertificateType = {
    id: number;
    documentId: string;
    content: string;
    recommendation: PrecoProps | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
};

const DiagnosticAcousticCertificate = () => {
    const { cx, classes } = useStyles();

    const [response, setResponse] = useState<AcoustiCertificateType | null>(null);
    const [recommendation, setRecommendation] = useState<PrecoProps | null>(null);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_CMS_URL}/api/acoustic-certificate`, {
                params: {
                    populate: {
                        recommendation: {
                            populate: {
                                imageBanner: true,
                                imageThumbnail: true,
                            },
                        },
                    },
                },
            })
            .then((res) => {
                setResponse(res.data.data);
                setRecommendation(res.data.data.recommendation);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);


    if (!response) {
        return <></>;
    }

    return (<div className={fr.cx("fr-mb-6v")}>
        {response.content && (
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
                    <div dangerouslySetInnerHTML={{ __html: response.content }}></div>
                    {recommendation && (
                        <Card
                            background
                            border
                            enlargeLink
                            horizontal
                            imageAlt={recommendation.imageBanner?.alternativeText ?? ""}
                            imageUrl={recommendation.imageBanner?.url ? imgUrl(recommendation.imageBanner.url) : "/images/imgPlaceholder.png"}
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
        backgroundColor: fr.colors.decisions.background.contrast.purpleGlycine.default,
        color: fr.colors.decisions.text.label.purpleGlycine.default
    }
}));

export default DiagnosticAcousticCertificate;