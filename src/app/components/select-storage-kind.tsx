import { useEffect, useState } from "react";
import { StorageKind } from "../hooks/storage";

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

export const SelectStorageKind = ({
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
              disabled={kind === StorageKind.Arweave}
              type="checkbox"
              checked={checked}
              className="checkbox checkbox-primary checkbox-sm"
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
