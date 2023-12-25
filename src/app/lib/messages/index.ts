export enum ObjectStoreKind {
  Local = "Local",
  Remote = "Remote",
}

export interface Metadata {
  id: number;
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

export interface FileSystemBufferMetadata {
  store: number;
  prefixes: string[];
}

export interface BufferMetadata {
  name: string;
  common_schema: boolean;
  file_systems: FileSystemBufferMetadata[];
}

export interface CreateBufferMessage {
  metadata: BufferMetadata;
}

export type Messages =
  | {
      CreateObjectStore: CreateObjectStoreMessage;
    }
  | {
      CreateBuffer: CreateBufferMessage;
    };
