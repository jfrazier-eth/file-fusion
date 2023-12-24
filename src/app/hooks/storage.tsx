import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";
import { CreateObjectStoreMessage, Messages, Metadata } from "../lib/messages";

export type UseStorageResponse = Metadata;

export const useStorage = (params: {
  id: number | null;
  prefix: string | null;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["storage", `storage:${params.id}:${params.prefix}`],
    queryFn: () =>
      invoke<UseStorageResponse>("storage", {
        id: params.id,
        prefix: params.prefix,
      }),
  });

  const mutation = useMutation({
    mutationFn: (msg: CreateObjectStoreMessage) => {
      const message: Messages = {
        CreateObjectStore: msg,
      };
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

export type UseStoragesResponse = Metadata[];
export const useStorages = () => {
  const query = useQuery({
    queryKey: ["storages"],
    queryFn: () => invoke<UseStoragesResponse>("storages"),
  });

  return { query };
};
