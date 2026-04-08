import { tss } from "tss-react/dsfr";
import { MostRecentPreco, MostRecentPrecoProps } from "../components/home/MostRecentPreco";
import { AvailabilityMapProps, AvailabilityMap } from "../components/home/AvailabilityMap";
import About, { AboutHomePageProps, PartnersProps } from "../components/home/About";
import { useEffect, useState } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import axios from "axios";
import { Loader } from "../components/ui/Loader";
import DiagPreview from "../components/home/DiagPreview";
import { HomeSearch, HomeSearchProps } from "../components/home/HomeSearch";
import { StatsAndQuiz, StatsAndQuizProps } from "../components/home/StatsAndQuiz";
import { getIsMobile } from "../utils/tools";

interface HomePageContent {
  homeSearch: HomeSearchProps;
  availabilityMapContent: AvailabilityMapProps;
  aboutHomePage: AboutHomePageProps;
  mostRecentPreco: MostRecentPrecoProps;
  partners: PartnersProps;
  statsAndQuiz: StatsAndQuizProps;
}

const params = {
  "populate[aboutHomePage][populate][profilePicture][fields][0]": "alternativeText",
  "populate[aboutHomePage][populate][profilePicture][fields][1]": "height",
  "populate[aboutHomePage][populate][profilePicture][fields][2]": "width",
  "populate[aboutHomePage][populate][profilePicture][fields][3]": "url",
  "populate[partners][populate][partnersLogos][fields][0]": "alternativeText",
  "populate[partners][populate][partnersLogos][fields][1]": "height",
  "populate[partners][populate][partnersLogos][fields][2]": "width",
  "populate[partners][populate][partnersLogos][fields][3]": "url",
  "populate[homeSearch][populate][banner][fields][0]": "alternativeText",
  "populate[homeSearch][populate][banner][fields][1]": "height",
  "populate[homeSearch][populate][banner][fields][2]": "width",
  "populate[homeSearch][populate][banner][fields][3]": "url",
  "populate[statsAndQuiz][populate]": "*",
  "populate[availabilityMapContent][populate]": "*",
  "populate[mostRecentPreco][populate]": "*",
}

function HomePage() {
  const { cx, classes } = useStyles();
  usePageMeta("Accueil", "Intégrez le bruit dans les risques impactant les projets d'aménagement avec diagBruit.");
  const [homeContent, setHomeContent] = useState<HomePageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isMobile: boolean = getIsMobile();

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/home-page-content`, {
        params
      })
      .then((res) => {
        const item = res.data.data ?? null;
        if (!item) {
          setNotFound(true);
        } else {
          setHomeContent(item);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      {isLoading && (
        <div className={cx(classes.loaderContainer)}>
          <Loader text="Chargement..." />
        </div>
      )}
      {homeContent?.homeSearch && (
        <HomeSearch content={{ ...homeContent.homeSearch, isMobile }} />
      )}
      {!isMobile && (
        <DiagPreview />
      )}
      {homeContent?.statsAndQuiz && (
        <StatsAndQuiz content={homeContent.statsAndQuiz} />
      )}
      {homeContent?.mostRecentPreco && (
        <MostRecentPreco content={homeContent.mostRecentPreco} />
      )}
      {homeContent?.availabilityMapContent && (
        <AvailabilityMap content={homeContent.availabilityMapContent} />
      )}
      {homeContent?.aboutHomePage && homeContent?.partners && (
        <About content={homeContent.aboutHomePage} partners={homeContent.partners} />
      )}
    </div>
  );
}

const useStyles = tss.create(() => ({
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

export default HomePage;
