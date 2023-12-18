"use client";
import { invoke } from "@tauri-apps/api/tauri";
import { Storage } from "./storage";
import { useQuery } from "@tanstack/react-query";

export enum ContentKind {
  Directory = "Directory",
  File = "File",
}

export interface Content {
  path: string;
  kind: ContentKind;
}

interface UseContentResponse {
  path: string;
  items: Content[];
}

export const useContents = (storage: Storage) => {
  const query = useQuery({
    queryKey: [
      "storage:contents",
      `storage:contents:${storage.id}:path:${storage.path}`,
    ],
    queryFn: () =>
      invoke<UseContentResponse>("contents", {
        storage,
      }),
  });

  return {
    query,
  };
};
