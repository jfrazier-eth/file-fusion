import { Dispatch, ForwardedRef, SetStateAction, forwardRef } from "react";
import { ObjectStoreConnection, Storage } from "../hooks/storage";
import { TextInput } from "./text-input";

export type ObjectStoreEditorState = {
  storage: Omit<Storage, "id"> & { id: number | null };
  connection: ObjectStoreConnection;
};

export const ObjectStoreEditor = forwardRef(
  (
    {
      state,
      setState,
    }: {
      state: ObjectStoreEditorState;
      setState: Dispatch<SetStateAction<ObjectStoreEditorState>>;
    },
    ref: ForwardedRef<HTMLInputElement>,
  ) => {
    return (
      <div className="flex flex-col w-full">
        <div className="grid grid-cols-2 gap-2 w-full border-b border-b-neutral pb-3">
          <TextInput
            ref={ref}
            placeholder="Name"
            label="Name"
            value={state.storage.name}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                storage: {
                  ...prev.storage,
                  name: value,
                },
              }));
            }}
          />

          <TextInput
            placeholder="Path"
            label="Path"
            value={state.storage.path}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                storage: {
                  ...prev.storage,
                  path: value,
                },
              }));
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <TextInput
            placeholder="us-east-1"
            label="Region"
            value={state.connection.region}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                connection: {
                  ...prev.connection,
                  region: value,
                },
              }));
            }}
          />

          <TextInput
            placeholder="Bucket"
            label="Bucket"
            value={state.connection.bucket}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                connection: {
                  ...prev.connection,
                  bucket: value,
                },
              }));
            }}
          />

          <TextInput
            placeholder="Access key"
            label="Access key"
            value={state.connection.accessKey}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                connection: {
                  ...prev.connection,
                  accessKey: value,
                },
              }));
            }}
          />

          <TextInput
            placeholder="Access key secret"
            label="Access key secret"
            value={state.connection.accessKeySecret}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                connection: {
                  ...prev.connection,
                  accessKeySecret: value,
                },
              }));
            }}
          />

          <TextInput
            placeholder="Endpoint"
            label="Endpoint"
            value={state.connection.endpoint}
            onChange={(value) => {
              setState((prev) => ({
                ...prev,
                connection: {
                  ...prev.connection,
                  endpoint: value,
                },
              }));
            }}
          />
        </div>
      </div>
    );
  },
);
ObjectStoreEditor.displayName = "ObjectStoreEditor";
