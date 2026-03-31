import { fr } from "@codegouvfr/react-dsfr";

export const TallyForm = () => {
    return (
        <div className={fr.cx("fr-card", "fr-p-4v")}>
            <iframe
                data-tally-src="https://tally.so/embed/1A4kZL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height={275}
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title="Votre avis sur diagBruit"
            />
        </div>
    )
}

export default TallyForm;