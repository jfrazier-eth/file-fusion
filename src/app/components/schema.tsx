import { useTable } from "../hooks/table";
import { TableIcon } from "../icons/table";

interface Props {
  buffer: number;
  onClick: (data: string) => void;
}

export const Schema = (props: Props) => {
  const { query: table } = useTable(props.buffer);

  if (table.isError) {
    return <div>Failed to load schema {table.error?.toString?.()}</div>;
  }

  if (table.isPending) {
    return <div>Loading schema...</div>;
  }

  return (
    <div className="flex flex-col">
      <button
        className="btn rounded-sm btn-sm text-md flex flex-row items-center justify-start mb-2 overflow-clip flex-nowrap"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onClick(table.data.name);
        }}
      >
        <TableIcon /> <p className="ml-1 text-secondary">{table.data.name}</p>
      </button>
      <div className="flex flex-col text-sm border-l border-secondary pl-1">
        {table.data.schema.fields.map((item) => {
          if (typeof item.data_type === "string") {
            return (
              <button
                key={item.name}
                className="btn rounded-sm btn-xs flex flex-row justify-between my-0.5 overflow-clip flex-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onClick(item.name);
                }}
              >
                <div>{item.name}</div>
                <div className="bg-neutral py-0.5 px-1 rounded-sm">
                  {item.data_type}
                </div>
              </button>
            );
          } else if ("List" in item.data_type) {
            let dataType = item.data_type.List.data_type;
            return (
              <button
                key={item.name}
                className="btn rounded-sm btn-xs flex flex-row justify-between my-0.5 overflow-clip flex-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onClick(item.name);
                }}
              >
                <div>{item.name}</div>
                <div className="bg-neutral py-0.5 px-1 rounded-sm">
                  [{dataType}]
                </div>
              </button>
            );
          } else if ("Timestamp" in item.data_type) {
            let precision = item.data_type.Timestamp[0];
            return (
              <button
                key={item.name}
                className="btn rounded-sm btn-xs flex flex-row justify-between my-0.5 overflow-clip flex-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onClick(item.name);
                }}
              >
                <div>{item.name}</div>
                <div className="bg-neutral py-0.5 px-1 rounded-sm">
                  {precision}
                </div>
              </button>
            );
          }

          console.warn("unknown data type", item.data_type);
          let dataType = (item.data_type as any).toString();
          return (
            <div
              key={item.name}
              className="flex flex-row justify-between my-0.5"
            >
              <div>{item.name}</div>
              <div className="bg-neutral py-0.5 px-1 rounded-sm">
                {dataType}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
