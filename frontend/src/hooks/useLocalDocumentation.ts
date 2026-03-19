import axios from "axios";
import { useEffect, useState } from "react";
import type { LocalDocumentation } from "../utils/types";

const useLocalDocumentation = (codeinsee: string) => {
  const [localDocumentations, setLocalDocumentations] = useState<
    LocalDocumentation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/local-documentations`, {
        params: {
          populate: "*",
          filters: {
            codeinsees: {
              codeinsee: {
                $eq: codeinsee,
              },
            },
          },
        },
      })
      .then((res) => {
        setLocalDocumentations(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [codeinsee]);

  return { localDocumentations, isLoading };
};

export default useLocalDocumentation;
