import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Card from "@codegouvfr/react-dsfr/Card";
import { tss } from "tss-react/dsfr";

export interface StatsAndQuizProps {
    title: string;
    quiz: quizProps[];
    stats: statsProps[];
}

interface quizProps {
    title: string;
    content: string;
}

interface statsProps {
    title: string;
    description: string;
    sourceTitle: string;
    sourceLink: string;
}

const sliceText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

export const StatsAndQuiz = ({ content }: { content: StatsAndQuizProps }) => {
    const { cx, classes } = useStyles();

    const parser = new DOMParser();

    return (<div className={cx(classes.contentContainer)}>
        <h2>{content.title}</h2>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-4v")}>
            {content.stats.map((s) => (
                <div key={s.title} className={fr.cx("fr-col-12", "fr-col-md-4")}>
                    <Card
                        className={cx(classes.statCard)}
                        border
                        size="medium"
                        title={s.title}
                        titleAs="h3"
                        desc={s.description}
                        endDetail={<a href={s.sourceLink} target="_blank" rel="noopener noreferrer">{sliceText(s.sourceTitle, 40)}</a>} />
                </div>
            ))}
        </div>
        <div className={cx(classes.accordionContainer)}>
            {content.quiz.map((q, index) => (
                <Accordion
                    key={q.title + index}
                    label={q.title}>
                    <div dangerouslySetInnerHTML={{ __html: parser.parseFromString(q.content, "text/html").body.innerHTML }} />
                </Accordion>
            ))}
        </div>
    </div>)
}

const useStyles = tss.withName(StatsAndQuiz.name).create(() => ({
    contentContainer: {
        paddingTop: fr.spacing("8w"),
        paddingBottom: fr.spacing("8w"),
        borderBottom: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
    },
    statCard: {
        width: "100%",
        h3: {
            color: fr.colors.decisions.text.actionHigh.redMarianne.default,
        },
        p: {
            fontWeight: 700,
        },
        a: {
            fontWeight: 500,
        },
    },
    accordionContainer: {
        marginTop: fr.spacing("4v"),
    }
}));
