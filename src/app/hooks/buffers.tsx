import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";
import { CreateBufferMessage, Messages } from "../lib/messages";

export interface BufferItem {
  id: number;
  name: string;
}

export type UseBuffersResposne = BufferItem[];

export const useBuffers = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["storage:buffers"],
    queryFn: () =>
      invoke<UseBuffersResposne>("get_buffers").catch((e) => {
        console.error(e);
        throw e;
      }),
  });

  const mutation = useMutation({
    mutationFn: (msg: CreateBufferMessage) => {
      let message: Messages = {
        CreateBuffer: msg,
      };

      return invoke("update", {
        message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage:buffers"] });
    },
  });

  return {
    query,
    mutation,
  };
};
