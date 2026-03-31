import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { Quote } from "@codegouvfr/react-dsfr/Quote";

export interface AboutHomePageProps {
    id: number;
    textContent: string;
    author: string;
    description: string;
    source: string;
    profilePicture: ImageProps;
}

interface ImageProps {
    alternativeText: string | null; height: number; width: number; url: string
}

export interface PartnersProps {
    id: number;
    title: string;
    description: string;
    partnersLogos: ImageProps[];
}

export const About = ({ content, partners }: { content: AboutHomePageProps, partners: PartnersProps }) => {
    const { cx, classes } = useStyles();

    const parser = new DOMParser();
    const doc = parser.parseFromString(content.textContent, "text/html");
    const text = doc.body.innerHTML;
    const url = content.profilePicture?.url ? `${process.env.REACT_APP_CMS_URL}${content.profilePicture?.url}` : undefined;

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={cx(classes.quoteContainer)}>
                <h2>À propos</h2>
                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-col-12")}>
                    <div className="fr-col-6">
                        <Quote
                            author={content.author}
                            imageUrl={url ?? "//www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.1x1.png"}
                            size="xlarge"
                            source={content.source}
                            text={content.description}
                        />
                    </div>
                    <div className={cx("fr-col-6", classes.textContainer)}>
                        <div
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    </div>
                </div>
            </div>
            <div className={cx(classes.partnersContainer)}>
                <p className={cx("fr-text--xl", "fr-text--bold")}>{partners.title}</p>
                <p className={cx("fr-text--lg", "fr-mb-8v")}>{partners.description}</p>
                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-grid-row--middle")}>
                    {partners.partnersLogos.map((logo, index) => (
                        <div key={index} className={fr.cx("fr-col-6", "fr-col-sm-4", "fr-col-md-2")}>
                            <img
                                src={`${process.env.REACT_APP_CMS_URL}${logo.url}`}
                                alt={logo.alternativeText ?? ""}
                                className={cx(classes.partnerLogo)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const useStyles = tss.withName(About.name).create(() => ({
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        marginBottom: fr.spacing("8v"),
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
    },
    textContainer: {
        paddingLeft: `${fr.spacing("10w")} !important`,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
    },
    quoteContainer: {
        borderBottom: `1px solid #d9d9d9`,
        paddingBottom: fr.spacing("8w"),
        marginBottom: fr.spacing("8w"),
    },
    partnersContainer: {
        justifyContent: "center",
        alignItems: "center",
        display: "flex !important",
        flexDirection: "column",
    },
    partnerLogo: {
        width: "100%",
        height: "60px",
        objectFit: "contain",
        display: "block",
        margin: "0 auto",
    }

}));

export default About;