"use client";

import { useState } from "react";
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

      <Card as="section" aria-labelledby="shared-title" className="flex flex-col items-start gap-3">
        <h2 id="shared-title" className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="profile" className="size-5" />
          {a.sharedTitle}
        </h2>
        <p>{a.sharedBody}</p>
        <Button variant="danger" disabled={!hasData} onClick={() => setConfirming(true)}>
          {a.delete}
        </Button>
      </Card>

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
