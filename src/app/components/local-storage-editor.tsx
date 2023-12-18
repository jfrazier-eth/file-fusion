import {
  Dispatch,
  ForwardedRef,
  SetStateAction,
  forwardRef,
  useEffect,
} from "react";
import { useHomeDir } from "../hooks/home-dir";
import { Storage } from "../hooks/storage";
import { TextInput } from "./text-input";

export type LocalStorageEditorState = Omit<Storage, "path" | "id"> & {
  path: string | null;
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
    const { query: homeDir } = useHomeDir();

    useEffect(() => {
      if (storage.path === null && homeDir.isSuccess) {
        setStorage((prev) => ({
          ...prev,
          path: homeDir.data,
        }));
      }
    }, [storage, homeDir, setStorage]);

    return (
      <div className="flex flex-col w-full">
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
          placeholder="Path"
          label="Path"
          value={storage.path || ""}
          onChange={(value) => {
            setStorage((prev) => ({
              ...prev,
              path: value,
            }));
          }}
        />
      </div>
    );
  },
);
LocalStorageEditor.displayName = "LocalStorageEditor";
