import { Storage, StorageConnection } from "@/app/hooks/storage";

export interface CreateStorageMessage {
  storage: Omit<Storage, "id">;
  connection: StorageConnection;
}

export type Messages = {
  CreateStorage: CreateStorageMessage;
};
