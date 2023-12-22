import { useState } from "react";
import { Metadata } from "../lib/messages";
import { Content, ContentKind } from "./contents";
import { RegisterBuffer } from "../lib/messages/buffer";
import { invoke } from "@tauri-apps/api/tauri";

export interface BufferStateItem {
  id: string;
  store: Pick<Metadata, "id" | "name" | "kind">;
  kind: ContentKind;
  prefix: string;
}

export const getId = (storeId: number, prefix: string) => {
  return `store:${storeId}:prefix:${prefix}`;
};

export const register = async (
  state: Record<string, BufferStateItem>,
): Promise<string[]> => {
  const buffer: RegisterBuffer = {
    file_systems: [],
  };

  for (const item of Object.values(state) as BufferStateItem[]) {
    buffer.file_systems.push({
      store: item.store.id,
      prefixes: [item.prefix],
    });
  }

  return await invoke("register_buffer", { request: buffer });
};

export const useBufferState = () => {
  const [state, setState] = useState<Record<string, BufferStateItem>>({});
  const [tables, setTables] = useState<string[]>([]);

  const add = (
    content: Content,
    store: Pick<Metadata, "id" | "name" | "kind">,
  ) => {
    const id = getId(store.id, content.prefix);

    const item: BufferStateItem = {
      id,
      store: {
        id: store.id,
        name: store.name,
        kind: store.kind,
      },
      kind: content.kind,
      prefix: content.prefix,
    };

    setState((prev) => {
      return {
        ...prev,
        [id]: item,
      };
    });
  };

  const remove = (id: string) => {
    setState((prev) => {
      delete prev[id];
      return {
        ...prev,
      };
    });
  };

  const toggle = (
    content: Content,
    store: Pick<Metadata, "id" | "name" | "kind">,
  ) => {
    const id = getId(store.id, content.prefix);

    const item: BufferStateItem = {
      id,
      store: {
        id: store.id,
        name: store.name,
        kind: store.kind,
      },
      kind: content.kind,
      prefix: content.prefix,
    };
    setState((prev) => {
      if (id in prev) {
        delete prev[id];
        return {
          ...prev,
        };
      } else {
        prev[id] = item;
        return {
          ...prev,
          [id]: item,
        };
      }
    });
  };

  const reset = () => {
    setState({});
  };

  const registerBuffer = () => {
    register(state)
      .then((tables) => {
        console.log(`Registered tables`, tables);
        setTables(tables);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return {
    state,
    add,
    remove,
    toggle,
    reset,
    register: registerBuffer,
  };
};
