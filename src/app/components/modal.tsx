import { useEffect, useRef, useState } from "react";

export function Modal({
  isOpen,
  close,
  save,
}: {
  isOpen: boolean;
  close: () => void;
  save: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        buttonRef.current?.click();
      } else if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  return (
    <>
      <input
        type="checkbox"
        id="my_modal_6"
        className="modal-toggle z-10"
        checked={isOpen}
        onChange={() => {
          // ignore
          return;
        }}
      />
      <div
        className="modal z-15"
        role="dialog"
        onClick={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div
          className="modal-box max-w-sm p-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={close}
          >
            ✕
          </button>
          <h3 className="font-bold text-lg text-center w-full mb-2">
            New Folder
          </h3>

          <div className="flex flex-row">
            <input
              type="text"
              placeholder="Name"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              className="input input-bordered grow"
            />
            <button
              className="btn btn-primary ml-2 z-20"
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
        </div>
      </div>
    </>
  );
}
