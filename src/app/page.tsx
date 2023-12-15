"use client";
import { useEffect, useState } from "react";
import { Header } from "./components/header";
import { FolderIcon } from "./icons/folder";
import { Modal } from "./components/modal";
import { Locations } from "./components/locations";
import { useHomeDir } from "./hooks/home-dir";
import { isOk } from "./hooks/async-hook";
import { useContents } from "./hooks/contents";
import { Contents } from "./components/contents";
import { useElementSize } from "./hooks/element-size";

export default function Home() {
  let [isOpen, setIsOpen] = useState(false);
  const homeDir = useHomeDir();
  const contents = useContents(homeDir);
  const [container, { height: containerHeight }] = useElementSize();
  const [header, { height: headerHeight }] = useElementSize();

  const title = isOk(homeDir) ? homeDir.data : "Loading...";

  return (
    <div className="h-screen w-screen flex flex-col" ref={container}>
      <div ref={header}>
        <Header title={title}>
          <button
            className="btn btn-outline btn-sm btn-primary"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <>
              New Folder
              <FolderIcon />
            </>
          </button>
        </Header>
      </div>

      <div
        className={`flex flex-row h-[${
          containerHeight - headerHeight
        }px] max-h-[${containerHeight - headerHeight}px] overflow-clip`}
      >
        <Locations />
        <div className="p-2 text-sm h-full max-h-full grow overflow-clip">
          {isOk(contents) ? (
            <Contents items={contents.data.items} />
          ) : (
            "Loading..."
          )}
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        save={(value) => {
          console.log(`Saving ${value}`);
        }}
      ></Modal>
    </div>
  );
}
