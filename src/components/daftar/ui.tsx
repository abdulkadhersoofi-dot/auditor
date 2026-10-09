import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink placeholder:text-muted";
export const primaryClass =
  "h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40";
export const quietClass = "h-11 rounded-lg border border-line bg-sheet px-4 text-sm font-medium text-ink";

export function ViewSwitch({
  value,
  onChange,
}: {
  value: "thread" | "bills";
  onChange: (value: "thread" | "bills") => void;
}) {
  const items = [
    { id: "thread" as const, label: "Chats" },
    { id: "bills" as const, label: "Bills" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1">
      {items.map((item) => {
        const on = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(item.id)}
            className={cn("h-11 rounded-full text-sm font-medium", on ? "bg-sheet text-ink" : "text-muted")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise-in relative z-10 m-3 w-full max-w-md rounded-3xl border border-line bg-sheet p-4 pb-safe text-ink"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
