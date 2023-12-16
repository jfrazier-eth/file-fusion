import { Content, ContentKind } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";
import { StorageLink } from "./storage-link";
import { Storage } from "../hooks/storage";

export function Contents(props: { items: Content[]; storage: Storage }) {
  return (
    <div className="overflow-auto h-full">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item) => {
            let Icon = item.kind === ContentKind.File ? FileIcon : FolderIcon;
            const name = item.path.split("/").pop() || "";
            const itemStorage: Storage = {
              ...props.storage,
              name,
              path: item.path,
            };
            return (
              <tr key={item.path} className="hover:bg-neutral">
                <th>
                  <StorageLink storage={itemStorage}>
                    <Icon />
                  </StorageLink>
                </th>
                <td className="flex flex-row items-center">
                  <StorageLink storage={itemStorage} key={item.path}>
                    <p className="ml-2">{name}</p>
                  </StorageLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
