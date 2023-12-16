import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const useParams = () => {
  const query = useSearchParams();
  const [params, setParams] = useState<{
    id: string | null;
    path: string | null;
  }>({ id: null, path: null });

  useEffect(() => {
    const id = query.get("id");
    const path = query.get("path");

    setParams({
      id,
      path,
    });
  }, [query]);

  return params;
};
