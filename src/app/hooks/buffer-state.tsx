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

export const useBufferState = () => {
  const [state, setState] = useState<Record<string, BufferStateItem>>({});

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

  return {
    state,
    add,
    remove,
    toggle,
    reset,
  };
};
