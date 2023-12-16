"use client";
import { useEffect, useState } from "react";
import { Header } from "./components/header";
import { FolderIcon } from "./icons/folder";
import { Modal } from "./components/modal";
import { Locations } from "./components/locations";
import { isOk } from "./hooks/async-hook";
import { useContents } from "./hooks/contents";
import { Contents } from "./components/contents";
import { useElementSize } from "./hooks/element-size";
import { useStorage } from "./hooks/storage";
import { useSearchParams } from "next/navigation";

const useParams = () => {
  const query = useSearchParams();
  const [params, setParams] = useState<{
    id: string | null;
    path: string | null;
  }>({ id: null, path: null });

  useEffect(() => {
    const id = query.get("id");
    const path = query.get("path");

    setParams({
      id,
      path,
    });
  }, [query]);

  return params;
};

export default function Home() {
  let [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const storage = useStorage(params);

  const contents = useContents(storage);
  const [container, { height: containerHeight }] = useElementSize();
  const [header, { height: headerHeight }] = useElementSize();

  const title = isOk(storage) ? storage.data.name : "Loading...";

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
        className={`flex flex-row h-full max-h-[${
          containerHeight - headerHeight
        }px] overflow-clip`}
      >
        <Locations />
        <div className="p-2 text-sm h-full max-h-full grow overflow-clip">
          {isOk(contents) && isOk(storage) ? (
            <Contents items={contents.data.items} storage={storage.data} />
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
