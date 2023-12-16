import { useEffect, useRef, useState } from "react";
import { Modal } from "./modal";

interface Props {
  isOpen: boolean;
  close: () => void;
  save: (value: string) => void;
}

export const NewFolderModal = ({ isOpen, close, save }: Props) => {
  const [value, setValue] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        buttonRef.current?.click();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [buttonRef]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, inputRef]);

  return (
    <Modal isOpen={isOpen} close={close} title="New Folder">
      <div className="flex flex-row">
        <input
          ref={inputRef}
          type="text"
          placeholder="Name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          className="input input-bordered grow"
        />
        <button
          className="btn btn-secondary ml-2"
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (value.length > 0) {
              save(value);
              setValue("");
            }
            close();
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
};
