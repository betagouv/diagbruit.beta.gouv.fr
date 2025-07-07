import { useEffect, useState } from "react";
import axios from "axios";
import { Changelog } from "../utils/types";
import { Loader } from "../components/ui/Loader";
import { fr } from "@codegouvfr/react-dsfr";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { tss } from "tss-react/dsfr";

function ChangelogsPage() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { cx, classes } = useStyles();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/changelogs`, {
        params: {
          sort: "date:desc",
        },
      })
      .then((res) => {
        setChangelogs(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Erreur lors du chargement des actualités.");
        setIsLoading(false);
        console.error(err);
      });
  }, []);

  if (isLoading)
    return (
      <div className={fr.cx("fr-my-16w")}>
        <Loader />
      </div>
    );
  if (error) return <p>{error}</p>;

  return (
    <div className={cx(classes.container, fr.cx("fr-my-10v"))}>
      <h1 className={fr.cx("fr-mb-10v")}>Nouveautés sur diagBruit</h1>
      {changelogs.map((changelog) => (
        <div key={changelog.id} className={fr.cx("fr-mb-16v")}>
          <h2>{changelog.title}</h2>
          <Highlight>
            <p className={fr.cx("fr-hint-text")}>
              Publiée le {new Date(changelog.date).toLocaleDateString("fr-FR")}
            </p>
            <div
              className={cx(classes.changelogContent)}
              dangerouslySetInnerHTML={{ __html: changelog.content }}
            />
          </Highlight>
        </div>
      ))}
    </div>
  );
}

const useStyles = tss.create(() => ({
  container: {
    h1: {
      ...fr.typography[4].style,
    },
    h2: {
      ...fr.typography[2].style,
    },
  },
  changelogContent: {
    img: {
      height: "auto",
      aspectRatio: "auto",
    },
  },
}));

export default ChangelogsPage;
