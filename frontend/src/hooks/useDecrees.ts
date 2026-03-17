import axios from "axios";
import { useEffect, useState } from "react";
import type { Decree } from "../utils/types";

const useDecrees = (codedept: number) => {
  const [decrees, setDecrees] = useState<Decree[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/decrees`, {
        params: {
          filters: {
            codedept: {
              $eq: codedept,
            },
          },
        },
      })
      .then((res) => {
        setDecrees(res.data.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [codedept]);

  return { decrees, isLoading };
};

export default useDecrees;
