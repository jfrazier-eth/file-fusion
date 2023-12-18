import { ContentKind, useContents } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";
import { StorageLink } from "./storage-link";
import { Storage } from "../hooks/storage";

export function Contents(props: { storage: Storage }) {
  let { query: contents } = useContents(props.storage);

  if (contents.isPending) {
    return <span>Loading...</span>;
  }

  if (contents.isError) {
    return <span>Error: {contents.error.message}</span>;
  }

  return (
    <div className="overflow-auto h-full">
      <table className="table">
        <thead>
          <tr>
            <th className="w-8"></th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {contents.data.items.map((item) => {
            const isFile = item.kind === ContentKind.File;

            let Icon = isFile ? FileIcon : FolderIcon;
            const name = item.path.split("/").pop() || "";
            const itemStorage: Storage = {
              ...props.storage,
              name,
              path: item.path,
            };
            return (
              <tr
                key={item.path}
                className={`${
                  isFile ? "hover:bg-neutral text-primary" : "hover:bg-neutral"
                }`}
              >
                <th>
                  {isFile ? (
                    <FileIcon />
                  ) : (
                    <StorageLink storage={itemStorage}>
                      <Icon />
                    </StorageLink>
                  )}
                </th>
                <td className="flex flex-row items-center">
                  {isFile ? (
                    <p className="ml-2">{name}</p>
                  ) : (
                    <StorageLink storage={itemStorage} key={item.path}>
                      <p className={"ml-2"}>{name}</p>
                    </StorageLink>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
