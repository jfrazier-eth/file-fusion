"use client";
import { invoke } from "@tauri-apps/api/tauri";
import {
  AsyncHook,
  Ready,
  useAsyncDependentLoad,
  useAsyncHookState,
} from "./async-hook";
import { UseStorageResponse } from "./storage";

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

const getLoad = (response: Ready<UseStorageResponse>) => {
  return () =>
    invoke<UseContentResponse>("contents", {
      storage: response.data,
    });
};

export const useContents = (
  storage: AsyncHook<UseStorageResponse, unknown>,
) => {
  const load = useAsyncDependentLoad(storage, getLoad);
  const { value: contents } = useAsyncHookState<UseContentResponse>(load);

  return contents;
};
