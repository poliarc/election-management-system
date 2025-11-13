import { useEffect, useRef, useState } from "react";

export type ActionItem = {
  label: string;
  onClick: () => void;
  destructive?: boolean;
};

interface Props {
  items: ActionItem[];
  buttonTitle?: string;
}

export default function ActionDropdown({
  items,
  buttonTitle = "Actions",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="inline-block relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-indigo-100 text-indigo-700 rounded-full p-2 hover:bg-indigo-600 hover:text-white transition duration-150 shadow-sm"
        title={buttonTitle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
        <span className="sr-only">Open actions</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-xl z-10"
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                it.destructive ? "text-red-600 hover:bg-red-50" : ""
              }`}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
