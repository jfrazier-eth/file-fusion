"use client";
import { invoke } from "@tauri-apps/api/tauri";
import { useQuery } from "@tanstack/react-query";
import { Metadata } from "../lib/messages";

export enum ContentKind {
  Directory = "Directory",
  File = "File",
}

export interface Content {
  prefix: string;
  kind: ContentKind;
}

interface UseContentResponse {
  path: string;
  items: Content[];
}

export const useContents = (storage: Metadata) => {
  const query = useQuery({
    queryKey: [
      "storage:contents",
      `storage:contents:${storage.id}:prefix:${storage.prefix}`,
    ],
    queryFn: () =>
      invoke<UseContentResponse>("contents", {
        id: storage.id,
        prefix: storage.prefix,
      }),
  });

  return {
    query,
  };
};
