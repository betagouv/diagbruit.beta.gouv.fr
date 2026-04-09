import { fr, FrCxArg } from "@codegouvfr/react-dsfr";
import { useParams } from "react-router-dom";
import { Loader } from "../components/ui/Loader";
import usePreco from "../hooks/usePreco";
import { tss } from "tss-react/dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Card from "@codegouvfr/react-dsfr/Card";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Summary from "@codegouvfr/react-dsfr/Summary";
import { RichContent } from "../components/ui/RichContent";
import { usePageMeta } from "../hooks/usePageMeta";

const toAnchorId = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const PrecoPage = () => {
  const { classes, cx } = useStyles();

  const { slug } = useParams<{ slug: string }>();
  const { preco, isLoading, notFound } = usePreco(slug ?? "");

  const plainText = preco
    ? new DOMParser()
      .parseFromString(preco.aRetenir || preco.content, "text/html")
      .body.textContent?.trim()
      .slice(0, 160)
    : undefined;

  usePageMeta(preco?.title ?? "Préconisation", plainText);

  if (isLoading) {
    return (
      <div className={fr.cx("fr-my-16w")}>
        <Loader />
      </div>
    );
  }

  if (notFound || !preco) {
    return (
      <div className={fr.cx("fr-my-10v")}>
        <h1>404 - Préconisation introuvable</h1>
        <p>La page que vous cherchez n'existe pas ou a été supprimée.</p>
      </div>
    );
  }


  const parser = new DOMParser();
  const aRetenirDoc = parser.parseFromString(preco.aRetenir, "text/html");
  const contentDoc = parser.parseFromString(preco.content, "text/html");
  const h2Elements = Array.from(contentDoc.querySelectorAll("h2"));
  h2Elements.forEach((h2) => {
    h2.id = toAnchorId(h2.textContent ?? "");
  });
  const enrichedContent = contentDoc.body.innerHTML;
  const enrichedARetenir = aRetenirDoc.body.innerHTML;

  const keyPointsTitle = preco.keyPoints.length > 1 ? `Les ${preco.keyPoints.length} points clés` : "Le point clé";

  const h2Links = [
    ...(preco.keyPoints && preco.keyPoints.length > 0
      ? [{ id: toAnchorId(keyPointsTitle), label: keyPointsTitle }]
      : []),
    ...h2Elements.map((h2) => ({ id: h2.id, label: h2.textContent ?? "" })),
  ];

  return (
    <>
      {preco.imageBanner && (
        <div className={cx(classes.imageBannerWrapper)}>
          <img
            className={cx(classes.imageBanner)}
            src={
              preco.imageBanner.url.startsWith("/")
                ? `${process.env.REACT_APP_CMS_URL}${preco.imageBanner.url}`
                : preco.imageBanner.url
            }
            alt={preco.imageBanner.alternativeText ?? preco.title}
          />
        </div>
      )}
      <div className={fr.cx("fr-my-10v", "fr-col-12")}>
        <h1 className="fr-mb-4v">{preco.title}</h1>
        <p className={fr.cx("fr-text--sm")}>
          Dernière mise à jour le{" "}
          {new Date(preco.updatedAt).toLocaleDateString("fr-FR")}
        </p>

        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {h2Links.length > 0 && (
            <div className={cx("fr-col-12",
              "fr-col-lg-3",
              "fr-col-md-12",
              "fr-col-sm-12",
              "fr-mb-2w", classes.stickyNav)}>
              <Summary
                links={h2Links.map((link) => ({
                  text: link.label,
                  linkProps: { href: `#${link.id}` },
                }))}
              />
            </div>
          )}

          <div className={h2Links.length > 0 ? "fr-col-9" : "fr-col-12"}>
            {preco.aRetenir && (
              <Alert
                className={fr.cx("fr-mb-8v", "fr-py-4v", "fr-pl-14v")}
                title="À retenir"
                as="h2"
                description={
                  <RichContent
                    className={cx(classes.recommendationContent)}
                    html={enrichedARetenir}
                  />
                }
                onClose={function noRefCheck() { }}
                severity="info"
                small
              />
            )}
            {preco.keyPoints && preco.keyPoints.length > 0 && (
              <>
                <h2 id={toAnchorId(keyPointsTitle)}>{keyPointsTitle}</h2>
                <div
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-4v",
                  )}
                >
                  {preco.keyPoints.map((k, index) => (
                    <div
                      className={fr.cx(
                        `fr-col-${Math.max(4, Math.min(12, 12 / preco.keyPoints!.length))}` as FrCxArg,
                      )}
                      key={`keyPoint-${k.title}-${index}`}
                    >
                      <Card
                        border
                        desc={k.text}
                        size="medium"
                        title={k.title}
                        titleAs="h3"
                        start={
                          <ul className="fr-badges-group">
                            <li>
                              <Badge>Point n°{index + 1}</Badge>
                            </li>
                          </ul>
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            <RichContent
              className={cx(classes.recommendationContent)}
              html={enrichedContent}
            />
          </div>
        </div>
      </div >
    </>
  );
};

const useStyles = tss.withName(PrecoPage.name).create(() => ({
  imageBannerWrapper: {
    width: "100vw",
    maxHeight: "350px",
    overflow: "hidden",
    position: "relative",
    left: "50%",
    right: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
  },
  imageBanner: {
    width: "100%",
    height: "350px",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
  },
  recommendationContent: {
    img: {
      height: "auto",
      aspectRatio: "auto",
    },
  },
  stickyNav: {
    alignSelf: "flex-start",
    [fr.breakpoints.up("lg")]: {
      position: "sticky",
      top: fr.spacing("2v"),
    },
  },
}));

export default PrecoPage;
