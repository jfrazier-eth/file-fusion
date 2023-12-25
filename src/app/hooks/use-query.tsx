import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

export type Row = Record<string, string | number | object>;

const query = async (statement: string, buffer: number) => {
  const rows = (await invoke("query", {
    query: { statement, buffer },
  })) as Row[];

  return rows;
};

export const useQuery = (defaultValue: string, buffers: number[]) => {
  const [statement, setStatement] = useState(defaultValue);
  const [buffer, setBuffer] = useState(buffers[0]);

  const [results, setResults] = useState<Row[]>([]);

  const run = () => {
    setResults([]);
    query(statement, buffer)
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
    buffer,
    setBuffer,
  };
};
