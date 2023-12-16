import { useAsyncHookState } from "./async-hook";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback } from "react";

export enum StorageKind {
  Local,
  ObjectStore,
  Arweave,
}

export interface Storage {
  id: string;
  name: string;
  path: string;
  kind: StorageKind;
}

export type UseStorageResponse = Storage;

const getLoad = (params: { id: string | null; path: string | null }) => {
  return invoke<UseStorageResponse>("storage", {
    id: params.id,
    path: params.path,
  });
};

export const useStorage = (params: {
  id: string | null;
  path: string | null;
}) => {
  const load = useCallback(() => getLoad(params), [params]);
  const { value: location } = useAsyncHookState<UseStorageResponse>(load);

  return location;
};
