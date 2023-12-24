import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

export type Row = Record<string, string | number | object>;

const query = async (statement: string) => {
  const rows = (await invoke("query", {
    query: { statement, buffer: 1 }, // TODO
  })) as Row[];

  return rows;
};

export const useQuery = (defaultValue: string) => {
  const [statement, setStatement] = useState(defaultValue);

  const [results, setResults] = useState<Row[]>([]);

  const run = () => {
    setResults([]);
    query(statement)
      .then((value) => {
        setResults(value);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return {
    statement,
    setStatement,
    run,
    results,
  };
};
