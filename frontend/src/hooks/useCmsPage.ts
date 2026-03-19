import axios from "axios";
import { useEffect, useState } from "react";

const useCmsPage = (slug: string) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/${slug}`)
      .then((res) => {
        setContent(res.data.data.content);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  return { content, isLoading };
};

export default useCmsPage;
