import { fr, FrCxArg } from "@codegouvfr/react-dsfr";
import { useParams } from "react-router-dom";
import { Loader } from "../components/ui/Loader";
import usePreco from "../hooks/usePreco";
import { tss } from "tss-react/dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Card from "@codegouvfr/react-dsfr/Card";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Summary from "@codegouvfr/react-dsfr/Summary";
import { useEffect } from "react";

const toAnchorId = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const PrecoPage = () => {
  const { classes, cx } = useStyles();

  const { slug } = useParams<{ slug: string }>();
  const { preco, isLoading, notFound } = usePreco(slug ?? "");

  useEffect(() => {
    if (!preco) return;

    document.title = `${preco.title} - Diagbruit`;

    const parser = new DOMParser();
    const plainText = parser
      .parseFromString(preco.aRetenir || preco.content, "text/html")
      .body.textContent?.trim()
      .slice(0, 160);

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", plainText ?? "");

    return () => {
      document.title = "Diagbruit";
    };
  }, [preco]);

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

  const keyPointsTitle = "Les 4 points clés";

  const parser = new DOMParser();
  const aRetenirDoc = parser.parseFromString(preco.aRetenir, "text/html");
  const contentDoc = parser.parseFromString(preco.content, "text/html");
  const h2Elements = Array.from(contentDoc.querySelectorAll("h2"));
  h2Elements.forEach((h2) => {
    h2.id = toAnchorId(h2.textContent ?? "");
  });
  const enrichedContent = contentDoc.body.innerHTML;
  const enrichedARetenir = aRetenirDoc.body.innerHTML;

  const h2Links = [
    ...(preco.keyPoints && preco.keyPoints.length > 0
      ? [{ id: toAnchorId(keyPointsTitle), label: keyPointsTitle }]
      : []),
    ...h2Elements.map((h2) => ({ id: h2.id, label: h2.textContent ?? "" })),
  ];

  return (
    <>
      {preco.imageBanner && (
        <img
          className={cx(classes.imageBanner)}
          src={`${process.env.REACT_APP_CMS_URL}${preco.imageBanner.url}`}
          alt={preco.imageBanner.alternativeText ?? preco.title}
        />
      )}
      <div className={fr.cx("fr-my-10v", "fr-col-12")}>
        <h1>{preco.title}</h1>
        <p>
          Dernière mise à jour le{" "}
          {new Date(preco.updatedAt).toLocaleDateString("fr-FR")}
        </p>

        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {h2Links.length > 0 && (
            <div className={cx("fr-col-3", classes.stickyNav)}>
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
                description={
                  <div
                    className={cx(classes.recommendationContent)}
                    dangerouslySetInnerHTML={{ __html: enrichedARetenir }}
                  />
                }
                onClose={function noRefCheck() {}}
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
            <div
              className={cx(classes.recommendationContent)}
              dangerouslySetInnerHTML={{ __html: enrichedContent }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const useStyles = tss.withName(PrecoPage.name).create(() => ({
  imageBanner: {
    width: "100%",
    height: "240px",
    objectFit: "cover",
    display: "block",
  },
  recommendationContent: {
    img: {
      height: "auto",
      aspectRatio: "auto",
    },
  },
  stickyNav: {
    position: "sticky",
    top: fr.spacing("2v"),
    alignSelf: "flex-start",
  },
}));

export default PrecoPage;
