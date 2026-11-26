import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import usePrecosBySlugs from "../../../hooks/usePrecosBySlugs";
import CardPreco from "../../ui/CardPreco";

const ISOLATION_RESOURCES = [
  { slug: "realiser-une-etude-acoustique", badge: "Article" },
  {
    slug: "isolement-acoustique-des-facades-adapter-les-solutions-aux-objectifs-de-performance",
    badge: "Doc technique",
  },
];

const RegulationIsolationResources = () => {
  const { cx, classes } = useStyles();
  const { precosBySlug, isLoading } = usePrecosBySlugs(
    ISOLATION_RESOURCES.map((resource) => resource.slug),
  );

  return (
    <div className={classes.grid} aria-busy={isLoading}>
      {ISOLATION_RESOURCES.map((resource, index) => {
        const preco = precosBySlug[resource.slug];

        if (!preco) {
          return (
            <div
              key={index}
              className={cx(classes.slot, classes.emptyCard)}
              aria-hidden="true"
            />
          );
        }

        return (
          <div key={preco.slug} className={classes.slot}>
            <CardPreco
              horizontal
              title={preco.title}
              titleAs="h5"
              slug={preco.slug}
              imageUrl={preco.imageUrl}
              imageAlt={preco.imageAlt}
              start={
                <Badge
                  small
                  noIcon
                  className={fr.cx("fr-badge--purple-glycine")}
                >
                  {resource.badge}
                </Badge>
              }
              target
            />
          </div>
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
    marginBottom: fr.spacing("4v"),
    [fr.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  slot: {
    minHeight: "11rem",
  },
  emptyCard: {
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    backgroundColor: fr.colors.decisions.background.default.grey.default,
  },
}));
