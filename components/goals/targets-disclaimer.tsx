import { getMessages } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";

export function TargetsDisclaimer() {
  const t = getMessages();
  return (
    <aside aria-label={t.disclaimer.title} className="flex items-start gap-3 rounded-control border border-line bg-surface-muted p-4 text-sm">
      <Icon name="info" className="mt-0.5 size-5 shrink-0" />
      <p>{t.disclaimer.body}</p>
    </aside>
  );
}
