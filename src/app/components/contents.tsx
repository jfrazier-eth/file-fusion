import { ContentKind, useContents } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";
import { Metadata } from "../lib/messages";
import { StorageLink } from "./storage-link";

export function Contents(props: { metadata: Metadata }) {
  let { query: contents } = useContents(props.metadata);

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
            const name = item.prefix.split("/").pop() || "";
            const metadata: Metadata = {
              ...props.metadata,
              name,
              prefix: item.prefix,
            };
            return (
              <tr
                key={item.prefix}
                className={`${
                  isFile ? "hover:bg-neutral text-primary" : "hover:bg-neutral"
                }`}
              >
                <th>
                  {isFile ? (
                    <FileIcon />
                  ) : (
                    <StorageLink metadata={metadata}>
                      <Icon />
                    </StorageLink>
                  )}
                </th>
                <td className="flex flex-row items-center">
                  {isFile ? (
                    <p className="ml-2">{name}</p>
                  ) : (
                    <StorageLink metadata={metadata} key={item.prefix}>
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
