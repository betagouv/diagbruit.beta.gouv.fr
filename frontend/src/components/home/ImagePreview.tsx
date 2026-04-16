import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

interface ImagePreviewProps {
    src: string;
    width: number;
    height: number;
    alt?: string;
}

export const ImagePreview = ({ src, width, height, alt = "Image preview" }: ImagePreviewProps) => {
    const { cx, classes } = useStyles();

    return (<div className={cx(classes.container, "fr-col-8")}>
        <img
            src={src}
            width={width}
            height={height}
            fetchPriority="high"
            className={cx(classes.image)}
            alt={alt}
        />

    </div>)
}

const useStyles = tss.withName(ImagePreview.name).create(() => ({
    container: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("2v")} auto`,
    },
    image: {
        width: "100%",
        height: "auto",
        display: "flex",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        boxShadow: "0 2px 6px rgba(0, 0, 18, 0.16)",
    },

}));