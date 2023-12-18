import {
  Dispatch,
  ForwardedRef,
  SetStateAction,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { StorageKind, Storage } from "../hooks/storage";
import { Modal } from "./modal";
import { useHomeDir } from "../hooks/home-dir";
import { isOk } from "../hooks/async-hook";
import { CreateStorageMessage } from "../lib/messages";

interface Props {
  isOpen: boolean;
  close: () => void;
  save: (data: CreateStorageMessage) => void;
}

const labels = {
  [StorageKind.Local]: "Local",
  [StorageKind.ObjectStore]: "Object Store",
  [StorageKind.Arweave]: "Arweave",
} as const;

const getStorageKindOptions = (selected: StorageKind) => {
  return Object.values(StorageKind).map((kind) => {
    return {
      kind,
      label: labels[kind],
      checked: kind === selected,
    };
  });
};

const SelectStorageKind = ({
  selected,
  setSelected,
}: {
  selected: StorageKind;
  setSelected: (item: StorageKind) => void;
}) => {
  const [storageKinds, setStorageKinds] = useState(
    getStorageKindOptions(selected),
  );

  useEffect(() => {
    setStorageKinds(getStorageKindOptions(selected));
  }, [selected, setStorageKinds]);

  return (
    <label className="form-control flex flex-row w-full items-center justify-between">
      {storageKinds.map(({ kind, checked, label }) => {
        return (
          <label className="label cursor-pointer" key={kind}>
            <span className="label-text mr-2">{label}</span>
            <input
              type="checkbox"
              checked={checked}
              className="checkbox checkbox-primary checkbox-sm"
              // onClick={() => {
              //   setSelected(kind);
              // }}
              onChange={(_) => {
                setSelected(kind);
              }}
            />
          </label>
        );
      })}
    </label>
  );
};

const LocalStorageEditor = forwardRef(
  (
    {
      storage,
      setStorage,
    }: {
      storage: Omit<Storage, "path"> & { path: string | null };
      setStorage: Dispatch<
        SetStateAction<Omit<Storage, "path"> & { path: string | null }>
      >;
    },
    ref: ForwardedRef<HTMLInputElement>,
  ) => {
    const homeDir = useHomeDir();

    useEffect(() => {
      if (storage.path === null && isOk(homeDir)) {
        setStorage((prev) => ({
          ...prev,
          path: homeDir.data,
        }));
      }
    }, [storage, homeDir, setStorage]);

    return (
      <div className="flex flex-col w-full">
        <input
          ref={ref}
          type="text"
          placeholder="Name"
          value={storage.name}
          onChange={(e) => {
            setStorage((prev) => ({ ...prev, name: e.target.value }));
          }}
          className="input input-bordered input-sm rounded-sm my-2 grow"
        />

        <input
          type="text"
          placeholder="Path"
          value={storage.path || ""}
          onChange={(e) => {
            setStorage((prev) => ({ ...prev, path: e.target.value }));
          }}
          className="input input-bordered input-sm rounded-sm my-2 grow"
        />
      </div>
    );
  },
);
LocalStorageEditor.displayName = "LocalStorageEditor";

export const NewStorageModal = ({ isOpen, close, save }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<StorageKind>(StorageKind.Local);

  const [localStorage, setLocalStorage] = useState<
    Omit<Storage, "path"> & { path: string | null }
  >({
    id: 0, // TODO
    name: "",
    path: null,
    kind: StorageKind.Local,
  });

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

        <div className="grow flex flex-col">
          {kind === StorageKind.Local ? (
            <LocalStorageEditor
              storage={localStorage}
              setStorage={setLocalStorage}
              ref={initialInputRef}
            />
          ) : kind === StorageKind.ObjectStore ? (
            <div>Object Store</div>
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
