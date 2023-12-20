import { useEffect, useState } from "react";
import { ObjectStoreKind } from "../lib/messages";

const labels = {
  [ObjectStoreKind.Local]: "Local",
  [ObjectStoreKind.Remote]: "Remote",
} as const;

const getStorageKindOptions = (selected: ObjectStoreKind) => {
  return Object.values(ObjectStoreKind).map((kind) => {
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
  selected: ObjectStoreKind;
  setSelected: (item: ObjectStoreKind) => void;
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
