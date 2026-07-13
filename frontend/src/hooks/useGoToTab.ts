import { useSearchParams } from "react-router-dom";

export const useGoToTab = () => {
  const [, setSearchParams] = useSearchParams();

  return (tab: string) => {
    const next = new URLSearchParams(window.location.search);
    next.set("tab", tab);
    setSearchParams(next);
  };
};
