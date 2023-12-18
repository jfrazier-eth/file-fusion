import { useEffect, useRef, useState } from "react";
import { StorageKind } from "../hooks/storage";
import { Modal } from "./modal";
import { CreateStorageMessage } from "../lib/messages";
import { SelectStorageKind } from "./select-storage-kind";
import {
  LocalStorageEditor,
  LocalStorageEditorState,
} from "./local-storage-editor";
import {
  ObjectStoreEditor,
  ObjectStoreEditorState,
} from "./object-store-editor";

interface Props {
  isOpen: boolean;
  close: () => void;
  save: (data: CreateStorageMessage) => void;
}

export const NewStorageModal = ({ isOpen, close, save }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<StorageKind>(StorageKind.Local);

  const [localStorage, setLocalStorage] = useState<LocalStorageEditorState>({
    id: null,
    path: null,
    name: "",
    kind: StorageKind.Local,
  });

  const [objectStore, setObjectStore] = useState<ObjectStoreEditorState>({
    storage: {
      id: null,
      name: "",
      path: "",
      kind: StorageKind.ObjectStore,
    },
    connection: {
      region: "",
      bucket: "",
      accessKey: "",
      accessKeySecret: "",
      endpoint: "",
    },
  });

  useEffect(() => {
    if (isOpen && initialInputRef.current) {
      initialInputRef.current.focus();
    }
  }, [initialInputRef, isOpen, kind]);

  const handleSave = () => {
    let message: CreateStorageMessage;
    switch (kind) {
      case StorageKind.Local: {
        message = {
          storage: {
            kind: StorageKind.Local,
            name: localStorage.name,
            path: localStorage.path || "",
          },
          connection: {
            Local: {},
          },
        };
        break;
      }
      case StorageKind.ObjectStore: {
        message = {
          storage: {
            kind: StorageKind.ObjectStore,
            name: objectStore.storage.name,
            path: objectStore.storage.path || "",
          },
          connection: {
            ObjectStore: {
              ...objectStore.connection,
            },
          },
        };
        break;
      }
      default: {
        throw new Error("Not yet implemented");
      }
    }

    save(message);
    close();
  };

  return (
    <Modal isOpen={isOpen} close={close} title="New Storage Location">
      <div className="flex flex-col min-h-[300px] justify-between">
        <div className="flex flex-row w-full">
          <SelectStorageKind selected={kind} setSelected={setKind} />
        </div>

        <div className="grow flex flex-col mb-4">
          {kind === StorageKind.Local ? (
            <LocalStorageEditor
              storage={localStorage}
              setStorage={setLocalStorage}
              ref={initialInputRef}
            />
          ) : kind === StorageKind.ObjectStore ? (
            <ObjectStoreEditor
              state={objectStore}
              setState={setObjectStore}
              ref={initialInputRef}
            />
          ) : (
            <div></div>
          )}
        </div>

        <button
          disabled={kind === StorageKind.Arweave}
          className="btn btn-secondary btn-sm rounded-sm"
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
};
