import { useAsyncHookState } from "./async-hook";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback } from "react";

export enum StorageKind {
  Local = "Local",
  ObjectStore = "ObjectStore",
  Arweave = "Arweave",
}

export interface Storage {
  id: number;
  name: string;
  path: string;
  kind: StorageKind;
}

export interface LocalConnection {}

export interface ObjectStoreConnection {
  region: string;
  bucket: string;
  accessKey: string;
  accessKeySecret: string;
  endpoint: string;
}

export interface ArweaveConnection {}

export type StorageConnection =
  | {
      Local: LocalConnection;
    }
  | {
      ObjectStore: ObjectStoreConnection;
    }
  | {
      Arweave: ArweaveConnection;
    };

export type UseStorageResponse = Storage;

const getLoad = (params: { id: number | null; path: string | null }) => {
  return invoke<UseStorageResponse>("storage", {
    id: params.id,
    path: params.path,
  });
};

export const useStorage = (params: {
  id: number | null;
  path: string | null;
}) => {
  const load = useCallback(() => getLoad(params), [params]);
  const { value: storage } = useAsyncHookState<UseStorageResponse>(load);

  return storage;
};

export type UseStoragesResponse = Storage[];

const loadStorages = () => invoke<UseStoragesResponse>("storages");
export const useStorages = () => {
  const { value: storages } =
    useAsyncHookState<UseStoragesResponse>(loadStorages);

  return storages;
};
