import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";
import { Messages } from "../lib/messages";

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

export const useStorage = (params: {
  id: number | null;
  path: string | null;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["storage", `storage:${params.id}:${params.path}`],
    queryFn: () =>
      invoke<UseStorageResponse>("storage", {
        id: params.id,
        path: params.path,
      }),
  });

  const mutation = useMutation({
    mutationFn: (message: Messages) => {
      return invoke("update", {
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storages"] });
    },
  });

  return {
    query,
    mutation,
  };
};

export type UseStoragesResponse = Storage[];
export const useStorages = () => {
  const query = useQuery({
    queryKey: ["storages"],
    queryFn: () => invoke<UseStoragesResponse>("storages"),
  });

  return { query };
};
