"use client";
import { useCallback, useState } from "react";
import { Header } from "./components/header";
import { Locations } from "./components/locations";
import { Contents } from "./components/contents";
import { useElementSize } from "./hooks/element-size";
import { useStorage } from "./hooks/storage";
import { useParams } from "./hooks/params";
import { useKeyBindings } from "./hooks/key-bindings";
import { NewStorageModal } from "./components/new-storage-modal";
import { Messages } from "./lib/messages";
import { StagingBuffer } from "./components/staging-buffer";
import { useBufferState } from "./hooks/buffer-state";
import { useRouter } from "next/navigation";

export default function Home() {
  let [isNewStorageModalOpen, setIsNewStorageModalOpen] = useState(false);
  const params = useParams();
  const { query: storage, mutation: storageMutation } = useStorage(params);
  const { state, remove, toggle, reset } = useBufferState();
  const toggleNewStorageModal = useCallback(
    () => setIsNewStorageModalOpen((prev) => !prev),
    [setIsNewStorageModalOpen],
  );
  const router = useRouter();
  useKeyBindings({
    bindings: [
      {
        name: "back",
        metaKey: true,
        key: "[",
        description: "Navigate to the previous page",
        onPress: router.back,
      },
      {
        name: "forward",
        metaKey: true,
        key: "]",
        description: "Navigate to the next page",
        onPress: router.forward,
      },
      {
        name: "Toggle storage modal",
        metaKey: true,
        key: "n",
        description: "Toggle the new storage modal",
        onPress: toggleNewStorageModal,
      },
      {
        name: "Clear buffer",
        metaKey: true,
        key: "Backspace",
        description: "Clear the buffer list",
        onPress: reset,
      },
    ],
  });

  const [container, { height: containerHeight }] = useElementSize();
  const [header, { height: headerHeight }] = useElementSize();

  if (storage.isPending) {
    return <span>Loading...</span>;
  }

  if (storage.isError) {
    return <span>Error: {storage.error.message}</span>;
  }

  return (
    <div className="h-screen w-screen flex flex-col" ref={container}>
      <div ref={header}>
        <Header metadata={storage.data} />
      </div>

      <div
        className={`flex flex-row h-full max-h-[${
          containerHeight - headerHeight
        }px] overflow-clip`}
      >
        <Locations
          metadata={storage.data}
          onNewClick={() => setIsNewStorageModalOpen(true)}
        />
        <div className="p-2 text-sm h-full max-h-full grow overflow-clip">
          <Contents
            bufferState={state}
            metadata={storage.data}
            onIconClick={(item) => {
              toggle(item, storage.data);
            }}
          />
        </div>

        <StagingBuffer
          state={state}
          remove={remove}
          reset={reset}
        ></StagingBuffer>
      </div>
      <NewStorageModal
        isOpen={isNewStorageModalOpen}
        close={() => setIsNewStorageModalOpen(false)}
        save={(value) => {
          const message: Messages = {
            CreateObjectStore: value,
          };
          storageMutation.mutate(message);
        }}
      />
    </div>
  );
}
