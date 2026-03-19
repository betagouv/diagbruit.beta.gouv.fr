import { fr } from "@codegouvfr/react-dsfr";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";

function StatsPage() {
  const [IFrameUrl, setIFrameUrl] = useState<string>();

  const { cx, classes } = useStyles();

  useEffect(() => {
    const fetchIframeUrl = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/metabase/iframe/stats`
        );
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setIFrameUrl(data.iframe_url);
      } catch (error) {
        console.error("Failed to fetch iframe URL:", error);
      }
    };

    fetchIframeUrl();
  }, []);

  return (
    <div className={cx(classes.container, fr.cx("fr-mb-10v"))}>
      {IFrameUrl && (
        <iframe
          title="stats"
          src={IFrameUrl}
          width={"100%"}
          height={1700}
          allowTransparency
        />
      )}
    </div>
  );
}

const useStyles = tss.create(() => ({
  container: {},
}));

export default StatsPage;
