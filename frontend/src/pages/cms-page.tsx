import { fr } from "@codegouvfr/react-dsfr";
import { Loader } from "../components/ui/Loader";
import useCmsPage from "../hooks/useCmsPage";

function CmsPage({ slug }: { slug: string }) {
  const { content, isLoading } = useCmsPage(slug);

  if (isLoading)
    return (
      <div className={fr.cx("fr-my-16w")}>
        <Loader />
      </div>
    );

  return (
    <div
      className={fr.cx("fr-my-10v")}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default CmsPage;
