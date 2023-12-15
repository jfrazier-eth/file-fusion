import { Content, ContentKind } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";

export function Contents(props: { items: Content[] }) {
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
            const name = item.path.split("/").pop();
            return (
              <tr key={item.path} className="hover:bg-neutral">
                <th>
                  <Icon />
                </th>
                <td className="flex flex-row items-center">
                  <p className="ml-2">{name}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
