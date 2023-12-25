import { useState } from "react";
import { Metadata } from "../lib/messages";
import { Content, ContentKind } from "./contents";

export interface BufferStateItem {
  id: string;
  store: Pick<Metadata, "id" | "name" | "kind">;
  kind: ContentKind;
  prefix: string;
}

export const getId = (storeId: number, prefix: string) => {
  return `store:${storeId}:prefix:${prefix}`;
};

export interface BufferState {
  items: Record<string, BufferStateItem>;
  name: string;
  id: string | null;
}

export const useBufferState = () => {
  const [state, setState] = useState<BufferState>({
    items: {},
    name: "",
    id: null,
  });

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
        items: {
          ...prev.items,
          [id]: item,
        },
      };
    });
  };

  const remove = (id: string) => {
    setState((prev) => {
      delete prev.items[id];
      return {
        ...prev,
      };
    });
  };

  const setName = (name: string) => {
    setState((prev) => {
      return {
        ...prev,
        name,
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
      if (id in prev.items) {
        delete prev.items[id];
        return {
          ...prev,
        };
      } else {
        return {
          ...prev,
          items: {
            ...prev.items,
            [id]: item,
          },
        };
      }
    });
  };

  const reset = () => {
    setState({
      name: "",
      items: {},
      id: null,
    });
  };

  return {
    state,
    add,
    setName,
    remove,
    toggle,
    reset,
  };
};
