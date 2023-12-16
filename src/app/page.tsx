"use client";
import { useCallback, useState } from "react";
import { Header } from "./components/header";
import { FolderIcon } from "./icons/folder";
import { Locations } from "./components/locations";
import { isOk } from "./hooks/async-hook";
import { useContents } from "./hooks/contents";
import { Contents } from "./components/contents";
import { useElementSize } from "./hooks/element-size";
import { useStorage } from "./hooks/storage";
import { useParams } from "./hooks/params";
import { useKeyBindings } from "./hooks/key-bindings";
import { NewFolderModal } from "./components/new-folder-modal";
import { NewStorageModal } from "./components/new-storage-modal";

export default function Home() {
  let [isOpen, setIsOpen] = useState(false);
  let [isNewStorageModalOpen, setIsNewStorageModalOpen] = useState(false);
  const params = useParams();
  const storage = useStorage(params);

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

  const contents = useContents(storage);
  const [container, { height: containerHeight }] = useElementSize();
  const [header, { height: headerHeight }] = useElementSize();

  return (
    <div className="h-screen w-screen flex flex-col" ref={container}>
      <div ref={header}>
        <Header storage={storage}>
          <button
            className="btn btn-outline btn-sm btn-primary"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <div className="flex flex-row justify-center">
              <p className="mr-2">+</p>
              <FolderIcon />
            </div>
          </button>
        </Header>
      </div>

      <div
        className={`flex flex-row h-full max-h-[${
          containerHeight - headerHeight
        }px] overflow-clip`}
      >
        <Locations onNewClick={() => setIsNewStorageModalOpen(true)} />
        <div className="p-2 text-sm h-full max-h-full grow overflow-clip">
          {isOk(contents) && isOk(storage) ? (
            <Contents items={contents.data.items} storage={storage.data} />
          ) : (
            "Loading..."
          )}
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
          console.log(`Saving ${value}`);
        }}
      />
    </div>
  );
}
