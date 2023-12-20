export enum ObjectStoreKind {
  Local = "Local",
  Remote = "Remote",
}

export interface Metadata {
  id: string;
  name: string;
  prefix: string;
  kind: ObjectStoreKind;
}

export interface LocalConnection {}

export interface RemoteConnection {
  region: string;
  bucket: string;
  access_key: string;
  access_key_secret: string;
  endpoint: string;
}

export type Connection =
  | {
      Local: LocalConnection;
    }
  | {
      Remote: RemoteConnection;
    };

export interface CreateObjectStoreMessage {
  metadata: Omit<Metadata, "id">;
  connection: Connection;
}

export type Messages = {
  CreateObjectStore: CreateObjectStoreMessage;
};
