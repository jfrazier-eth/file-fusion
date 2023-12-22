import { useEffect } from "react";

export function Modal({
  isOpen,
  close,
  title,
  children,
  className,
}: {
  isOpen: boolean;
  close: () => void;
  title: string;
  className?: string;
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
          className={`modal-box max-w-sm bg-primary-content border border-accent rounded-sm p-3 ${
            className ? className : ""
          }`}
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
