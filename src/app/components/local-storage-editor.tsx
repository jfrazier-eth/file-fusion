import { Dispatch, ForwardedRef, SetStateAction, forwardRef } from "react";

import { TextInput } from "./text-input";
import { Metadata } from "../lib/messages";

export type LocalStorageEditorState = Omit<Metadata, "prefix" | "id"> & {
  prefix: string | null;
  id: number | null;
};

export const LocalStorageEditor = forwardRef(
  (
    {
      storage,
      setStorage,
    }: {
      storage: LocalStorageEditorState;
      setStorage: Dispatch<SetStateAction<LocalStorageEditorState>>;
    },
    ref: ForwardedRef<HTMLInputElement>,
  ) => {
    return (
      <div className="flex flex-col w-full">
        <div className="grid grid-cols-2 gap-2 w-full pb-3">
          <TextInput
            ref={ref}
            placeholder="Name"
            label="Name"
            value={storage.name}
            onChange={(value) => {
              setStorage((prev) => ({
                ...prev,
                name: value,
              }));
            }}
          />

          <TextInput
            placeholder="Prefix"
            label="Prefix"
            value={storage.prefix || ""}
            onChange={(value) => {
              setStorage((prev) => ({
                ...prev,
                path: value,
              }));
            }}
          />
        </div>
      </div>
    );
  },
);
LocalStorageEditor.displayName = "LocalStorageEditor";
