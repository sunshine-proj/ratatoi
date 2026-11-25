"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { Icon } from "./icon";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, rendered at the bottom (within thumb reach on phones). */
  footer?: ReactNode;
  /** "sheet" slides up from the bottom on small screens; centred on larger ones. */
  variant?: "dialog" | "sheet";
  className?: string;
};

/**
 * Modal built on the native <dialog> element, which provides focus trapping,
 * Escape to close, inert background, and focus return for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "dialog",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Fires on Escape and on dialog.close(); keep parent state in sync.
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "bg-surface text-ink shadow-raised",
        "w-full max-w-lg p-0 backdrop:backdrop-blur-[1px]",
        variant === "sheet"
          ? "mx-auto mt-auto mb-0 max-h-[85dvh] rounded-t-card sm:my-auto sm:rounded-card"
          : "m-auto max-h-[85dvh] w-[calc(100%-2rem)] rounded-card",
        className,
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted"
          >
            <Icon name="close" label={t.common.close} />
          </button>
        </header>
        {children ? <div className="overflow-y-auto px-5 py-4">{children}</div> : null}
        {footer ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
