import { StorageKind, Storage } from "../hooks/storage";
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
            <li key={item.id} className="hover:bg-neutral">
              <StorageLink storage={item}>{item.name}</StorageLink>
            </li>
          );
        })}
        {/* <li>
          <a>Local</a>
        </li>
        <li>
          <a>Arweave</a>
        </li>
        <li>
          <a>Object store</a>
        </li> */}
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
          +
        </button>
      </div>
    </div>
  );
}
