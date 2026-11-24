"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import { usePlan } from "@/lib/planner/use-plan";
import { useSettings } from "@/lib/settings/use-settings";
import { useShoppingList } from "@/lib/shopping/use-shopping-list";
import { routes } from "@/lib/navigation";
import { planDocument } from "@/lib/planner/store";
import { settingsDocument } from "@/lib/settings/settings";
import { shoppingDocument } from "@/lib/shopping/store";
import { backupFileName, buildBackup, parseBackup, type BackupDocuments } from "@/lib/storage/backup";
import { deleteAllDeviceData, storedBytes } from "@/lib/storage/device-data";
import type { DocumentState } from "@/lib/storage/local-document";

/**
 * What's saved in this browser, and a way to delete all of it. Works even
 * when saved data can't be read, so it doubles as a recovery path.
 */
export function AccountSettings() {
  const t = getMessages();
  const a = t.account;
  const toast = useToast();
  const settings = useSettings().state;
  const plan = usePlan().state;
  const list = useShoppingList().state;
  const [confirming, setConfirming] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupDocuments | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function exportData() {
    const ready = <T,>(state: DocumentState<T>) => (state.status === "ready" ? state.value : null);
    const backup = buildBackup({ settings: ready(settings), plan: ready(plan), shopping: ready(list) });
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
    toast.show({ message: a.exported, tone: "success" });
  }

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.show({ message: a.importErrors.read, tone: "error" });
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      toast.show({ message: a.importErrors[result.error], tone: "error", duration: null });
      return;
    }
    setPendingImport(result.documents);
  }

  function confirmImport() {
    if (!pendingImport) return;
    // An explicit replace: writes even over data that couldn't be read.
    const results = [
      pendingImport.settings ? settingsDocument.write(pendingImport.settings) : settingsDocument.clear(),
      pendingImport.plan ? planDocument.write(pendingImport.plan) : planDocument.clear(),
      pendingImport.shopping ? shoppingDocument.write(pendingImport.shopping) : shoppingDocument.clear(),
    ];
    setPendingImport(null);
    toast.show(
      results.every((r) => r.ok)
        ? { message: a.imported, tone: "success" }
        : { message: t.settings.saveFailed, tone: "error", duration: null },
    );
  }

  const loading = [settings, plan, list].some((state) => state.status === "loading");

  function describe<T>(state: DocumentState<T>, ready: (value: T) => string): string {
    if (state.status === "ready") return ready(state.value);
    if (state.status === "invalid") return a.unreadable;
    return a.nothing;
  }

  const rows = [
    { label: a.goals, value: describe(settings, () => a.goalsSet) },
    { label: a.plan, value: describe(plan, (p) => formatPlural(a.planCount, p.meals.length)) },
    { label: a.list, value: describe(list, (l) => formatPlural(a.listCount, l.items.length)) },
  ];
  const hasData = [settings, plan, list].some((state) => state.status === "ready" || state.status === "invalid");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card as="section" aria-labelledby="stored-title" className="flex flex-col gap-3">
        <h2 id="stored-title" className="text-xl font-semibold">
          {a.storedTitle}
        </h2>
        <p className="text-ink-muted">{a.noAccount}</p>
        {loading ? (
          <p role="status">{t.pages.loading}</p>
        ) : (
          <>
            <dl className="divide-y divide-line rounded-control border border-line">
              {rows.map((row) => (
                <div key={row.label} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                  <dt className="font-medium">{row.label}</dt>
                  <dd className="text-ink-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
            {hasData ? (
              <p className="text-sm text-ink-muted">
                {formatMessage(a.size, { kb: formatNumber(Math.max(0.1, storedBytes() / 1024), undefined, 1) })}
              </p>
            ) : null}
          </>
        )}
      </Card>

      <Card as="section" aria-labelledby="export-title" className="flex flex-col items-start gap-3">
        <h2 id="export-title" className="text-xl font-semibold">
          {a.exportTitle}
        </h2>
        <p>{a.exportBody}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled={!hasData} onClick={exportData}>
            <Icon name="arrowDown" className="size-5" />
            {a.export}
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <Icon name="arrowUp" className="size-5" />
            {a.import}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            aria-label={a.importLabel}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              void chooseFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </Card>

      <Card as="section" aria-labelledby="shared-title" className="flex flex-col items-start gap-3">
        <h2 id="shared-title" className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="profile" className="size-5" />
          {a.sharedTitle}
        </h2>
        <p>{a.sharedBody}</p>
        <Button variant="danger" disabled={!hasData} onClick={() => setConfirming(true)}>
          {a.delete}
        </Button>
        <Link href={routes.privacy} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-2">
          {a.privacyLink}
        </Link>
      </Card>

      <Dialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title={a.importTitle}
        description={a.importBody}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingImport(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={confirmImport}>
              {a.importConfirm}
            </Button>
          </>
        }
      />

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={a.deleteTitle}
        description={a.deleteBody}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const result = deleteAllDeviceData();
                setConfirming(false);
                toast.show(
                  result.ok
                    ? { message: a.deleted, tone: "success" }
                    : { message: t.settings.saveFailed, tone: "error", duration: null },
                );
              }}
            >
              {a.deleteConfirm}
            </Button>
          </>
        }
      />
    </div>
  );
}
