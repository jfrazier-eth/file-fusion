import { ContentKind, useContents } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";
import { Metadata } from "../lib/messages";
import { StorageLink } from "./storage-link";

export function Contents(props: { metadata: Metadata }) {
  let { query: contents } = useContents(props.metadata);

  if (contents.isError) {
    return (
      <div className="overflow-auto h-full">
        <div className="m-auto w-full h-full flex flex-col justify-center">
          <p className="text-center">Error: {contents.error?.toString?.()}</p>
        </div>
      </div>
    );
  }
  if (contents.isPending) {
    return <span>Loading...</span>;
  }

  return (
    <div className="overflow-auto h-full">
      {contents.data.items.length > 0 ? (
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
                    isFile
                      ? "hover:bg-neutral text-primary"
                      : "hover:bg-neutral"
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
      ) : (
        <div className="m-auto w-full h-full flex flex-col justify-center">
          <p className="text-center">Empty</p>
        </div>
      )}
    </div>
  );
}
