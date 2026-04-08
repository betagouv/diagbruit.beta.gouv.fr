import { tss } from "tss-react/dsfr";
import useGetPrecosCards from "../hooks/useGetPrecosCards";
import { fr } from "@codegouvfr/react-dsfr";
import CardPreco from "../components/ui/CardPreco";
import { Loader } from "../components/ui/Loader";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useState } from "react";
import { normalize } from "../utils/tools";


export const SearchPrecoPage = () => {
    const { cx, classes } = useStyles();
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");

    const params: Record<string, string | number> = {
        "fields[0]": "title",
        "fields[1]": "slug",
        "populate[imageThumbnail][fields][0]": "url",
        "sort[0]": "createdAt:desc",
        "pagination[pageSize]": 100,
    };

    const { precos: allCards, isLoading } = useGetPrecosCards(params);

    const cards = query
        ? allCards.filter((c) => normalize(c.title).includes(normalize(query)))
        : allCards;

    return (
        <>
            {isLoading && (
                <div className={cx(classes.loaderContainer)}>
                    <Loader text="Chargement de la médiathèque..." />
                </div>
            )}
            <h1 className="fr-mt-6v">Des solutions pour se protéger du bruit</h1>
            <h2>
                Médiathèque de préconisations
            </h2>
            <div className={cx(classes.searchBarContainer, "fr-col-3")}>
                <SearchBar
                    label="Rechercher un mot-clé"
                    onButtonClick={(value) => setQuery(value)}
                    renderInput={({ className, id, placeholder, type }) =>
                        <input
                            id={id}
                            className={className}
                            placeholder={placeholder}
                            type={type}
                            value={search}
                            onChange={(event) => {
                                if (event.currentTarget.value === "") setQuery("");
                                setSearch(event.currentTarget.value);
                            }}
                        />
                    }
                />
            </div>
            {cards.length > 0 ? (
                <div className={cx(classes.cardContainer, "fr-grid-row", "fr-grid-row--gutters", "fr-mb-4v")}>
                    {cards.map((c) => (
                        <div className={fr.cx("fr-col-12", "fr-col-md-4")} key={c.title}>
                            <CardPreco key={c.title} title={c.title} imageUrl={c.imageUrl} slug={c.slug} />
                        </div>
                    ))}
                </div>
            ) : (<p>Aucune préconisation trouvée</p>)}
        </>
    )
}

const useStyles = tss.withName(SearchPrecoPage.name).create(() => ({
    cardContainer: {
        display: "flex",
        paddingBottom: fr.spacing("8v"),
    },
    searchBarContainer: {
        marginBottom: fr.spacing("8v"),
    },
    loaderContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        display: "flex",
        position: "fixed",
        top: 0,
        left: 0,
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        zIndex: 9999,
    },
}));

export default SearchPrecoPage;