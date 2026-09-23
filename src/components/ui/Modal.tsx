import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Portal-based dialog used for previews, confirmations and future flows
 * (artwork detail, auth, admin). Handles Escape, overlay clicks and body
 * scroll locking.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-canvas-raised shadow-modal animate-scale-in sm:rounded-2xl",
          "ring-1 ring-ink-100"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5">
            <h2 className="font-display text-xl font-medium text-ink-950">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-full p-2 text-ink-500 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-900"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
