import { useTable } from "../hooks/table";
import { TableIcon } from "../icons/table";

interface Props {
  buffer: number;
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
      <div className="text-md flex flex-row items-center justify-start">
        <TableIcon /> <p className="ml-2 text-accent">{table.data.name}</p>
      </div>
      <div className="flex flex-col text-sm border-l border-accent pl-1">
        {table.data.schema.fields.map((item) => {
          if (typeof item.data_type === "string") {
            return (
              <div
                key={item.name}
                className="flex flex-row justify-between my-0.5"
              >
                <div>{item.name}</div>
                <div className="bg-neutral py-0.5 px-1 rounded-sm">
                  {item.data_type}
                </div>
              </div>
            );
          } else if ("List" in item.data_type) {
            let dataType = item.data_type.List.data_type;
            return (
              <div
                key={item.name}
                className="flex flex-row justify-between my-0.5"
              >
                <div>{item.name}</div>
                <div className="bg-neutral py-0.5 px-1 rounded-sm">
                  [{dataType}]
                </div>
              </div>
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
