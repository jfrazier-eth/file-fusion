import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";

export type DataType =
  | string
  | {
      List: {
        data_type: string;
        dict_id: number;
        dict_is_ordered: boolean;
        metadata: unknown;
        name: string;
        nullable: boolean;
      };
    }
  | {
      Timestamp: [string, null | unknown];
    };

export interface Table {
  name: string;
  schema: {
    fields: {
      data_type: DataType;
      dict_id: number;
      dict_is_ordered: boolean;
      metadata: unknown;
      name: string;
      nullable: boolean;
    }[];
    metadata: unknown;
  };
}

export type UseTableResponse = Table;

export const useTable = (bufferId: number) => {
  const query = useQuery({
    queryKey: [`storage:table`, `storage:table:${bufferId}`],
    queryFn: () => {
      return invoke<UseTableResponse>("get_table", { id: bufferId }).catch(
        (e) => {
          console.error(e);
          throw e;
        },
      );
    },
  });

  return {
    query,
  };
};
