"use client";
import { useState } from "react";
import { Header } from "./components/header";
import { FolderIcon } from "./icons.tsx/folder";
import { Modal } from "./components/modal";

export default function Home() {
  let [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Header title="home">
        <button
          className="btn btn-outline btn-primary"
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
