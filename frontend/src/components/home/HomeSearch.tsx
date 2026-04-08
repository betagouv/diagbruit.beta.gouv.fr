import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { ImageProps } from "./About";
import AddressSearch, { AddressFeature } from "../search/AddressSearch";
import { useNavigate } from "react-router-dom";
import { encode } from "../../utils/compression";
import Button from "@codegouvfr/react-dsfr/Button";


export interface HomeSearchProps {
    title: string;
    description: string;
    banner: ImageProps;
    isMobile?: boolean;
}

export const HomeSearch = ({ content }: { content: HomeSearchProps }) => {
    const url = content.banner?.url ? `${process.env.REACT_APP_CMS_URL}${content.banner?.url}` : undefined;
    const { cx, classes } = useStyles({ url });
    const parser = new DOMParser();
    const doc = parser.parseFromString(content.description, "text/html");
    const text = doc.body.innerHTML;
    const navigate = useNavigate();


    return (<div className={cx(classes.bgContainer)}>
        <div className={cx(classes.contentContainer, "fr-col-10")}>
            <h1>
                {content.title}
            </h1>
            <div
                dangerouslySetInnerHTML={{ __html: text }}
            />
            <div className={cx(classes.searchAddressContainer)}>
                <AddressSearch
                    className={classes.searchAddress}
                    placeholder="Cherchez une ville, adresse..."
                    id="mapSearch"
                    onValueSelected={(feature: AddressFeature) => {
                        navigate({
                            pathname: "/diagnostic",
                            search: `?address=${encode(feature)}`,
                        });
                    }}
                    limit={3}
                    isMobile={content.isMobile}
                />
                <Button
                    className="fr-mt-8v"
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
        padding: fr.spacing("8v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("2v"),
    }


}));