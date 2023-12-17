import { useEffect } from "react";

export function Modal({
  isOpen,
  close,
  title,
  children,
}: {
  isOpen: boolean;
  close: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
        className="modal-toggle"
        checked={isOpen}
        onChange={() => {
          // ignore
          return;
        }}
      />
      <div
        className="modal min-w-[350px]"
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
          <h3 className="font-bold text-lg text-center w-full mb-2">{title}</h3>
          {children}
        </div>
      </div>
    </>
  );
}
