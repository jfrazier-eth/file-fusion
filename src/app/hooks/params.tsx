import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const useParams = () => {
  const query = useSearchParams();
  const [params, setParams] = useState<{
    id: number | null;
    prefix: string | null;
  }>({ id: null, prefix: null });

  useEffect(() => {
    const id = query.get("id");
    const prefix = query.get("prefix");

    setParams({
      id: id ? parseInt(id, 10) : null,
      prefix,
    });
  }, [query]);

  return params;
};
