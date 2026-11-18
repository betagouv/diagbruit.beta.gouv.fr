import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import usePrecosBySlugs from "../../../hooks/usePrecosBySlugs";
import CardPreco from "../../ui/CardPreco";

const ISOLATION_RESOURCES = [
  { slug: "test2", badge: "Article" },
  { slug: "preconisations-pour-l-installation-des-pompes-a-chaleur", badge: "Doc technique" },
];

const RegulationIsolationResources = () => {
  const { classes } = useStyles();
  const { precosBySlug, isLoading } = usePrecosBySlugs(
    ISOLATION_RESOURCES.map((resource) => resource.slug),
  );

  if (isLoading) return null;

  return (
    <div className={classes.grid}>
      {ISOLATION_RESOURCES.map((resource, index) => {
        const preco = precosBySlug[resource.slug];

        if (!preco) {
          return <div key={index} className={classes.emptyCard} aria-hidden="true" />;
        }

        return (
          <CardPreco
            key={preco.slug}
            horizontal
            title={preco.title}
            titleAs="h5"
            slug={preco.slug}
            imageUrl={preco.imageUrl}
            imageAlt={preco.imageAlt}
            start={
              <Badge small noIcon className={fr.cx("fr-badge--purple-glycine")}>
                {resource.badge}
              </Badge>
            }
            target
          />
        );
      })}
    </div>
  );
};

export default RegulationIsolationResources;

const useStyles = tss.create(() => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: fr.spacing("6v"),
    marginTop: fr.spacing("4v"),
    [fr.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  emptyCard: {
    minHeight: "11rem",
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    backgroundColor: fr.colors.decisions.background.default.grey.default,
  },
}));
