import { useEffect, useState } from "react";
import { BufferState, BufferStateItem } from "../hooks/buffer-state";
import { QueryIcon } from "../icons/query";
import { ClearIcon } from "../icons/clear";
import { DeleteIcon } from "../icons/delete";
import { StorageLink } from "./storage-link";
import { Metadata } from "../lib/messages";
import { useParams } from "../hooks/params";
import { shorten } from "../lib/utils";
import { TextInput } from "./text-input";

interface Props {
  state: BufferState;
  remove: (id: string) => void;
  reset: () => void;
  save: (state: BufferState) => void;
  openEditor: () => void;
  setName: (name: string) => void;
}

const format = (str: string) => shorten(str, 5, 5);

export const StagingBuffer = (props: Props) => {
  const params = useParams();
  const [items, setItems] = useState<BufferStateItem[]>([]);

  useEffect(() => {
    setItems(Object.values(props.state.items));
  }, [props.state]);

  return (
    <div className="flex flex-col h-full bg-base w-[22rem] min-w-[22rem] max-w-[22rem] border-l border-primary">
      <h2 className="text-sm text-center py-2 px-4 border-b border-neutral">
        Buffer
      </h2>
      <div className="flex flex-col grow justify-between text">
        <div className="flex flex-col">
          <div className="m-2">
            <TextInput
              value={props.state.name}
              onChange={props.setName}
              label={"Name"}
              placeholder={"Name"}
            />
          </div>

          <ul className="menu [&_li>*]:rounded-none p-0 w-full">
            {items.map((item) => {
              const parts = item.prefix.split("/");
              let shortName;

              if (parts.length < 2) {
                shortName = `${format(item.store.name)}://${format(
                  item.prefix,
                )}`;
              } else if (parts.length < 3) {
                const first = parts[0];
                const last = parts[parts.length - 1];
                shortName = `${format(item.store.name)}://${format(
                  first,
                )}/${format(last)}`;
              } else {
                const first = parts[0];
                const last = parts[parts.length - 1];
                shortName = `${format(item.store.name)}://${format(
                  first,
                )}/.../${format(last)}`;
              }
              const metadata: Metadata = {
                ...item.store,
                prefix: item.prefix,
              };

              const isAtLocation =
                params.id === metadata.id && params.prefix === item.prefix;
              return (
                <li
                  key={item.id}
                  className={`${
                    isAtLocation ? "text-primary" : ""
                  }border-b border-b-neutral flex flex-row justify-between items-center p-0 w-full flex-nowrap`}
                >
                  <StorageLink metadata={metadata} className="px-2 grow mr-1">
                    {shortName}
                  </StorageLink>

                  <div className="flex flex-row p-0 items-center justify-end w-min mr-2">
                    <button
                      className="btn h-full btn-outline btn-accent btn-xs m-0 py-0 flex flex-row justify-center items-center hover:bg-black hover:text-accent rounded-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.remove(item.id);
                      }}
                    >
                      <DeleteIcon className="h-full" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-row">
            <button
              className="btn btn-primary btn-sm grow rounded-none m-0 py-0 flex flex-row justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.openEditor();
              }}
            >
              <QueryIcon />
              <p className="text-xs text-neutral">(cmd+f)</p>
            </button>
            <div className="w-1 min-w-1"></div>

            <button
              className="btn btn-primary btn-sm grow rounded-none m-0 py-0 flex flex-row justify-center items-center"
              onClick={props.reset}
            >
              <ClearIcon />
              <div className="flex flex-row justify-center items-center">
                <p className="text-xs text-neutral">(cmd+</p>
                <DeleteIcon className="p-0 m-0 h-3 w-3 text-neutral" />
                <p className="text-xs text-neutral">)</p>
              </div>
            </button>
          </div>
          <div className="flex flex-row border-t border-neutral">
            <button
              className="btn btn-primary btn-sm grow rounded-none m-0 py-0 flex flex-row justify-center items-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.save(props.state);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
