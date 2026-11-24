"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = {
  id: string;
  label: ReactNode;
  panel: ReactNode;
};

type TabsProps = {
  /** Accessible name for the tab list. */
  label: string;
  tabs: readonly TabItem[];
  defaultTabId?: string;
  /** Controlled mode: pass both `value` and `onValueChange`. */
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
};

/**
 * WAI-ARIA tabs with automatic activation: Arrow keys move between tabs,
 * Home/End jump to the first/last, and only the selected tab is in the
 * Tab order (roving tabindex).
 */
export function Tabs({ label, tabs, defaultTabId, value, onValueChange, className }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultTabId ?? tabs[0]?.id);
  const selectedId = value ?? internal;
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  function select(id: string) {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    select(tab.id);
    tabRefs.current.get(tab.id)?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto rounded-control bg-surface-muted p-1"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === selectedId;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "min-h-11 flex-1 rounded-[calc(var(--radius-control)-0.25rem)] px-3 text-sm font-medium whitespace-nowrap transition-colors",
                // Selected state uses weight and a raised surface, not colour alone.
                selected ? "bg-surface font-semibold text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== selectedId}
          tabIndex={0}
          className="pt-4"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
