"use client";
import { useCallback, useState } from "react";
import { Header } from "./components/header";
import { FolderIcon } from "./icons/folder";
import { Locations } from "./components/locations";
import { Contents } from "./components/contents";
import { useElementSize } from "./hooks/element-size";
import { useStorage } from "./hooks/storage";
import { useParams } from "./hooks/params";
import { useKeyBindings } from "./hooks/key-bindings";
import { NewFolderModal } from "./components/new-folder-modal";
import { NewStorageModal } from "./components/new-storage-modal";
import { Messages } from "./lib/messages";

export default function Home() {
  let [isOpen, setIsOpen] = useState(false);
  let [isNewStorageModalOpen, setIsNewStorageModalOpen] = useState(false);
  const params = useParams();
  const { query: storage, mutation: storageMutation } = useStorage(params);

  const toggleNewFolderModal = useCallback(
    () => setIsOpen((prev) => !prev),
    [setIsOpen],
  );

  const toggleNewStorageModal = useCallback(
    () => setIsNewStorageModalOpen((prev) => !prev),
    [setIsNewStorageModalOpen],
  );

  useKeyBindings({
    toggleNewFolderModal,
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
        <Header storage={storage.data}>
          <button
            className="btn btn-outline btn-sm btn-primary"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <div className="flex flex-row justify-center">
              <FolderIcon />
              <p className="ml-1 text-xs text-neutral">(cmd + n)</p>
            </div>
          </button>
        </Header>
      </div>

      <div
        className={`flex flex-row h-full max-h-[${
          containerHeight - headerHeight
        }px] overflow-clip`}
      >
        <Locations
          storage={storage.data}
          onNewClick={() => setIsNewStorageModalOpen(true)}
        />
        <div className="p-2 text-sm h-full max-h-full grow overflow-clip">
          <Contents storage={storage.data} />
        </div>
      </div>

      <NewFolderModal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        save={(value) => {
          console.log(`Saving ${value}`);
        }}
      />
      <NewStorageModal
        isOpen={isNewStorageModalOpen}
        close={() => setIsNewStorageModalOpen(false)}
        save={(value) => {
          const message: Messages = {
            CreateStorage: value,
          };
          storageMutation.mutate(message);
        }}
      />
    </div>
  );
}
