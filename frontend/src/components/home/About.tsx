import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { Quote } from "@codegouvfr/react-dsfr/Quote";

export interface AboutHomePageProps {
    id: number;
    textContent: string;
    author: string;
    description: string;
    source: string;
}
export interface PartnersProps {
    id: number;
    title: string;
    description: string
}

export const About = ({ content, partners }: { content: AboutHomePageProps, partners: PartnersProps }) => {
    const { cx, classes } = useStyles();

    const parser = new DOMParser();
    const doc = parser.parseFromString(content.textContent, "text/html");
    const text = doc.body.innerHTML;

    return (
        <div className={cx(classes.contentContainer)}>
            <div className={cx(classes.quoteContainer)}>
                <h2>À propos</h2>
                <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-col-12")}>
                    <div className="fr-col-6">
                        <Quote
                            author={content.author}
                            imageUrl="//www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.1x1.png"
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
                <p className={cx("fr-text--lg")}>{partners.description}</p>
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
    }

}));

export default About;