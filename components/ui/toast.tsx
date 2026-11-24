"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getMessages } from "@/lib/i18n";
import { Icon, type IconName } from "./icon";

export type ToastTone = "info" | "success" | "error";

export type ToastOptions = {
  message: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss; `null` keeps it until dismissed. */
  duration?: number | null;
};

type Toast = Required<Omit<ToastOptions, "duration">> & { id: number; duration: number | null };

type ToastApi = {
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 6000;
const MAX_VISIBLE = 3;

const toneStyles: Record<ToastTone, { icon: IconName; className: string }> = {
  info: { icon: "info", className: "border-line-strong" },
  success: { icon: "check", className: "border-primary" },
  error: { icon: "alert", className: "border-danger" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    const toast: Toast = {
      id,
      message: options.message,
      tone: options.tone ?? "info",
      duration: options.duration === undefined ? DEFAULT_DURATION : options.duration,
    };
    setToasts((current) => [...current, toast].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const t = getMessages();
  return (
    // The live region is always mounted so screen readers announce new toasts.
    <section
      aria-label={t.a11y.notifications}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+0.75rem)] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end"
    >
      <ol role="status" aria-live="polite" className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} dismissLabel={t.common.dismiss} />
        ))}
      </ol>
    </section>
  );
}

function ToastItem({ toast, onDismiss, dismissLabel }: {
  toast: Toast;
  onDismiss: (id: number) => void;
  dismissLabel: string;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (toast.duration === null || paused) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, paused, onDismiss]);

  const tone = toneStyles[toast.tone];
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-control border-l-4 bg-surface py-2 pr-2 pl-3 text-ink shadow-raised",
        tone.className,
      )}
    >
      <Icon name={tone.icon} className="mt-2.5 size-5 shrink-0" />
      <p className="flex-1 py-2">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted"
      >
        <Icon name="close" className="size-5" label={dismissLabel} />
      </button>
    </li>
  );
}
