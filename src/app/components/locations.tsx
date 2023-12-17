import { StorageKind, Storage } from "../hooks/storage";
import { HardDriveIcon } from "../icons/hard-drive";
import { StorageLink } from "./storage-link";

interface Props {
  onNewClick: () => void;
}

const mockLocations: Storage[] = [
  {
    id: "1",
    name: "Local",
    path: "/Users/admin",
    kind: StorageKind.Local,
  },
  { id: "2", name: "S3", path: "", kind: StorageKind.ObjectStore },
  { id: "3", name: "Arweave", path: "", kind: StorageKind.Arweave },
];

export function Locations(props: Props) {
  const locations = mockLocations;
  return (
    <div className="flex flex-col h-full bg-base w-32 justify-between border-r border-primary">
      <ul className="menu [&_li>*]:rounded-none p-0">
        {locations.map((item) => {
          return (
            <li
              key={item.id}
              className="hover:bg-neutral border-b border-b-neutral"
            >
              <StorageLink storage={item}>{item.name}</StorageLink>
            </li>
          );
        })}
      </ul>

      <div>
        <button
          className="btn btn-primary btn-sm w-full rounded-none m-0 py-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.onNewClick();
          }}
        >
          <div className="flex flex-row items-center justify-center">
            <HardDriveIcon />
            <p className="ml-1 text-xs text-neutral">(cmd + s)</p>
          </div>
        </button>
      </div>
    </div>
  );
}
