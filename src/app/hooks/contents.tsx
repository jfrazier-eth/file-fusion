"use client";
import { invoke } from "@tauri-apps/api/tauri";
import {
  AsyncHook,
  Ready,
  useAsyncDependentLoad,
  useAsyncHookState,
} from "./async-hook";

export enum ContentKind {
  Directory,
  File,
}

export interface Content {
  path: string;
  kind: ContentKind;
}

interface UseContentResponse {
  path: string;
  items: Content[];
}

const getLoad = (path: Ready<string>) => {
  return () => invoke<UseContentResponse>("contents", { path: path.data });
};

export const useContents = (dir: AsyncHook<string, unknown>) => {
  const load = useAsyncDependentLoad(dir, getLoad);
  const { value: contents } = useAsyncHookState<UseContentResponse>(load);

  return contents;
};
