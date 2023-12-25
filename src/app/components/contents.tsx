import { useEffect, useState } from "react";
import { Content, ContentKind, useContents } from "../hooks/contents";
import { FileIcon } from "../icons/file";
import { FolderIcon } from "../icons/folder";
import { Metadata } from "../lib/messages";
import { StorageLink } from "./storage-link";
import { BufferState, getId } from "../hooks/buffer-state";

export function Contents(props: {
  metadata: Metadata;
  bufferState: BufferState;
  onIconClick: (item: Content) => void;
}) {
  let { query: contents } = useContents(props.metadata);

  const [data, setData] = useState<(Content & { isSelected: boolean })[]>([]);

  useEffect(() => {
    if (contents.isSuccess) {
      const transformed = contents.data.items.map((item) => {
        const id = getId(props.metadata.id, item.prefix);
        return {
          ...item,
          isSelected: !!props.bufferState.items[id],
        };
      });

      setData(transformed);
    } else {
      setData([]);
    }
  }, [contents.data, contents.isSuccess, props.metadata, props.bufferState]);

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
      {data.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th className="w-8">Select</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const isFile = item.kind === ContentKind.File;

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
                    isFile ? "hover:bg-neutral" : "hover:bg-neutral"
                  }`}
                >
                  <th
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      props.onIconClick(item);
                    }}
                  >
                    {isFile ? (
                      <FileIcon
                        className={
                          item.isSelected
                            ? "fill-primary text-white stroke-1"
                            : "fill-none"
                        }
                      />
                    ) : (
                      <FolderIcon
                        className={
                          item.isSelected
                            ? "fill-primary text-white stroke-1"
                            : "fill-none"
                        }
                      />
                    )}
                  </th>
                  <td className="flex flex-row items-center">
                    {isFile ? (
                      <p className="ml-2 text-primary">{name}</p>
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
