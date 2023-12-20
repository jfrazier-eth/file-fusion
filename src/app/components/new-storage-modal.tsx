import { useEffect, useRef, useState } from "react";

import { Modal } from "./modal";

import { SelectStorageKind } from "./select-storage-kind";
import {
  LocalStorageEditor,
  LocalStorageEditorState,
} from "./local-storage-editor";
import {
  ObjectStoreEditor,
  ObjectStoreEditorState,
} from "./object-store-editor";
import { CreateObjectStoreMessage, ObjectStoreKind } from "../lib/messages";

interface Props {
  isOpen: boolean;
  close: () => void;
  save: (data: CreateObjectStoreMessage) => void;
}

export const NewStorageModal = ({ isOpen, close, save }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<ObjectStoreKind>(ObjectStoreKind.Local);

  const [localStorage, setLocalStorage] = useState<LocalStorageEditorState>({
    id: null,
    prefix: null,
    name: "",
    kind: ObjectStoreKind.Local,
  });

  const [objectStore, setObjectStore] = useState<ObjectStoreEditorState>({
    storage: {
      id: null,
      name: "",
      prefix: "",
      kind: ObjectStoreKind.Remote,
    },
    connection: {
      region: "",
      bucket: "",
      access_key: "",
      access_key_secret: "",
      endpoint: "",
    },
  });

  useEffect(() => {
    if (isOpen && initialInputRef.current) {
      initialInputRef.current.focus();
    }
  }, [initialInputRef, isOpen, kind]);

  const handleSave = () => {
    let message: CreateObjectStoreMessage;
    switch (kind) {
      case ObjectStoreKind.Local: {
        message = {
          metadata: {
            kind: ObjectStoreKind.Local,
            name: localStorage.name,
            prefix: localStorage.prefix || "",
          },
          connection: {
            Local: {},
          },
        };
        break;
      }
      case ObjectStoreKind.Remote: {
        message = {
          metadata: {
            kind: ObjectStoreKind.Remote,
            name: objectStore.storage.name,
            prefix: objectStore.storage.prefix || "",
          },
          connection: {
            Remote: {
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
      <div className="flex flex-col min-h-[300px] justify-start">
        <div className="flex flex-row w-full">
          <SelectStorageKind selected={kind} setSelected={setKind} />
        </div>

        <div className="grow flex flex-col mb-4">
          {kind === ObjectStoreKind.Local ? (
            <LocalStorageEditor
              storage={localStorage}
              setStorage={setLocalStorage}
              ref={initialInputRef}
            />
          ) : (
            <ObjectStoreEditor
              state={objectStore}
              setState={setObjectStore}
              ref={initialInputRef}
            />
          )}
        </div>

        <button
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
