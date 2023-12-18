import { AsyncHook, isErr, isOk } from "../hooks/async-hook";
import { Storage, UseStoragesResponse } from "../hooks/storage";
import { HardDriveIcon } from "../icons/hard-drive";
import { StorageLink } from "./storage-link";

interface Props {
  onNewClick: () => void;
  storage: AsyncHook<UseStoragesResponse, string>;
}

export function Locations(props: Props) {
  return (
    <div className="flex flex-col h-full bg-base w-32 justify-between border-r border-primary">
      <ul className="menu [&_li>*]:rounded-none p-0">
        {isOk(props.storage) ? (
          props.storage.data.map((item) => {
            return (
              <li
                key={item.id}
                className="hover:bg-neutral border-b border-b-neutral"
              >
                <StorageLink storage={item}>{item.name}</StorageLink>
              </li>
            );
          })
        ) : isErr(props.storage) ? (
          <li className="hover:bg-neutral border-b border-b-neutral">
            {props.storage.error}
          </li>
        ) : (
          <li className="hover:bg-neutral border-b border-b-neutral">
            Loading...
          </li>
        )}
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
