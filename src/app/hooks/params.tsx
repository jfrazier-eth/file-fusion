import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const useParams = () => {
  const query = useSearchParams();
  const [params, setParams] = useState<{
    id: number | null;
    path: string | null;
  }>({ id: null, path: null });

  useEffect(() => {
    const id = query.get("id");
    const path = query.get("path");

    setParams({
      id: id ? parseInt(id, 10) : null,
      path,
    });
  }, [query]);

  return params;
};
