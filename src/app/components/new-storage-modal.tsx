import {
  ForwardedRef,
  Fragment,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { StorageKind } from "../hooks/storage";
import { Modal } from "./modal";

interface LocalStorage extends Storage {
  kind: StorageKind.Local;
}

interface ArweaveStorage extends Storage {
  kind: StorageKind.Arweave;
}

interface ObjectStoreStorage extends Storage {
  kind: StorageKind.ObjectStore;
  access: {
    region: string;
    bucket: string;
    accessKey: string;
    accessKeySecret: string;
    endpoint: string;
  };
}

type StorageWithCreds = LocalStorage | ArweaveStorage | ObjectStoreStorage;

interface Props {
  isOpen: boolean;
  close: () => void;
  save: (data: StorageWithCreds) => void;
}

const storageKindOptions = Object.values(StorageKind);
const SelectStorageKind = forwardRef(
  (
    {
      selected,
      setSelected,
    }: {
      selected: StorageKind;
      setSelected: (item: StorageKind) => void;
    },
    ref: ForwardedRef<HTMLSelectElement>,
  ) => {
    return (
      <label className="form-control flex flex-row w-full items-center justify-between">
        <div className="label">
          <span className="label-text">Location</span>
        </div>
        <select
          ref={ref}
          className="select ml-4 select-accent rounded-sm select-md w-full max-w-xs grow"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value as StorageKind);
          }}
        >
          {storageKindOptions.map((item) => {
            return <option key={item}>{item}</option>;
          })}
        </select>
      </label>
    );
  },
);
SelectStorageKind.displayName = "SelectStorageKind";

export const NewStorageModal = ({ isOpen, close, save }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [selected, setSelected] = useState<StorageKind>(StorageKind.Local);

  useEffect(() => {
    if (isOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isOpen, selectRef]);

  return (
    <Modal isOpen={isOpen} close={close} title="New Storage Location">
      <div className="flex flex-row">
        <SelectStorageKind
          selected={selected}
          setSelected={setSelected}
          ref={selectRef}
        />
        {/* <input
          ref={initialInputRef}
          type="select"
          placeholder="Name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          className="input input-bordered grow"
        />
        <button
          className="btn btn-secondary ml-2"
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (value.length > 0) {
              save(value);
              setValue("");
            }
            close();
          }}
        >
          Save
        </button> */}
      </div>
    </Modal>
  );
};
