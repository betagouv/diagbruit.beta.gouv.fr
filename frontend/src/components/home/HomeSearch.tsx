import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { ImageProps } from "./About";
import AddressSearch, { AddressFeature } from "../search/AddressSearch";
import { useNavigate } from "react-router-dom";
import { encode } from "../../utils/compression";
import Button from "@codegouvfr/react-dsfr/Button";
import { imgUrl } from "../../utils/tools";


export interface HomeSearchProps {
    title: string;
    description: string;
    banner: ImageProps;
    isMobile?: boolean;
}

export const HomeSearch = ({ content }: { content: HomeSearchProps }) => {
    const url = content.banner?.url ? imgUrl(content.banner.url)
        : undefined;
    const { cx, classes } = useStyles({ url });
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.description, "text/html");
    const text = doc.body.innerHTML;
    const navigate = useNavigate();


    return (<div className={cx(classes.bgContainer)}>
        <div className={cx(classes.contentContainer, "fr-col-12", "fr-col-md-9")}>
            <h1>
                {content.title}
            </h1>
            <div className={cx("fr-px-4v")}
                dangerouslySetInnerHTML={{ __html: text }}
            />
            <div className={cx(classes.searchAddressContainer)}>
                <AddressSearch
                    className={classes.searchAddress}
                    placeholder="Renseignez une adresse"
                    id="mapSearch"
                    onValueSelected={(feature: AddressFeature | null) => {
                        navigate({
                            pathname: "/diagnostic",
                            search: `?address=${encode(feature)}`,
                        });
                    }}
                    limit={3}
                    isMobile={content.isMobile}
                />
                <Button
                    className="fr-mt-6v"
                    onClick={() => {
                        navigate({
                            pathname: "/diagnostic",
                            search: `?parcelleSearch=${encode(true)}`,
                        });
                    }}
                    priority="secondary"
                >
                    ou rechercher une parcelle cadastrale
                </Button>
            </div>
        </div>
    </div>)
}

export const HomeSearchSkeleton = () => {
    const { cx, classes } = useSkeletonStyles();
    return (
        <div className={cx(classes.bgContainer)}>
            <div className={cx(classes.contentContainer, "fr-col-10")}>
                <div className={cx(classes.skeletonTitle)} />
                <div className={cx(classes.skeletonLine)} />
                <div className={cx(classes.skeletonLineShort)} />
                <div className={cx(classes.searchBox)}>
                    <div className={cx(classes.skeletonInput)} />
                    <div className={cx(classes.skeletonButton)} />
                </div>
            </div>
        </div>
    );
};

const useSkeletonStyles = tss.withName("HomeSearchSkeleton").create(() => ({
    bgContainer: {
        paddingTop: fr.spacing("12w"),
        paddingBottom: fr.spacing("12w"),
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        backgroundColor: fr.colors.decisions.background.contrast.grey.default,
    },
    contentContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 auto",
        gap: fr.spacing("3v"),
    },
    skeletonTitle: {
        height: "40px",
        width: "60%",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("1v"),
        opacity: 0.3,
    },
    skeletonLine: {
        height: "20px",
        width: "80%",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("1v"),
        opacity: 0.3,
    },
    skeletonLineShort: {
        height: "20px",
        width: "50%",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("1v"),
        opacity: 0.3,
    },
    searchBox: {
        marginTop: fr.spacing("4v"),
        padding: fr.spacing("8v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("2v"),
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("4v"),
    },
    skeletonInput: {
        height: "40px",
        width: "100%",
        backgroundColor: fr.colors.decisions.background.contrast.grey.default,
        borderRadius: fr.spacing("1v"),
        opacity: 0.5,
    },
    skeletonButton: {
        height: "40px",
        width: "280px",
        alignSelf: "center",
        backgroundColor: fr.colors.decisions.background.contrast.grey.default,
        borderRadius: fr.spacing("1v"),
        opacity: 0.5,
    },
}));

const useStyles = tss.withName(HomeSearch.name).withParams<{ url?: string }>().create(({ url }) => ({
    bgContainer: {
        paddingTop: fr.spacing("12w"),
        paddingBottom: fr.spacing("12w"),
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
        position: "relative",
        ...(url && {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            h1: {
                color: `${fr.colors.decisions.background.default.grey.default} !important`,
            },
            color: fr.colors.decisions.background.default.grey.default,
        }),
    },
    contentContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        margin: "0 auto",
        textAlign: "center",
    },
    searchAddress: {
        width: "100%",
    },
    searchAddressContainer: {
        padding: fr.spacing("5w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("2v"),
    }
}));