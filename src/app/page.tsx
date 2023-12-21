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

export default function Home() {
  let [isNewStorageModalOpen, setIsNewStorageModalOpen] = useState(false);
  const params = useParams();
  const { query: storage, mutation: storageMutation } = useStorage(params);

  const toggleNewStorageModal = useCallback(
    () => setIsNewStorageModalOpen((prev) => !prev),
    [setIsNewStorageModalOpen],
  );

  useKeyBindings({
    toggleNewStorageModal,
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
          <Contents metadata={storage.data} />
        </div>
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
