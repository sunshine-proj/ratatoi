import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

const t = getMessages();
const p = t.privacy;

export const metadata: Metadata = { title: p.title };

const sections = [
  { id: "stored", title: p.storedTitle, body: p.stored },
  { id: "health", title: p.healthTitle, body: p.health },
  { id: "not-collected", title: p.notCollectedTitle, body: p.notCollected },
  { id: "server", title: p.serverTitle, body: p.server },
  { id: "offline", title: p.offlineTitle, body: p.offline },
  { id: "shared", title: p.sharedTitle, body: p.shared },
  { id: "rights", title: p.rightsTitle, body: p.rights },
  { id: "advice", title: p.adviceTitle, body: p.advice },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title={p.title} intro={p.intro} />
      <Card as="section" aria-labelledby="privacy-summary" className="flex flex-col gap-3">
        <h2 id="privacy-summary" className="text-xl font-semibold">
          {p.summaryTitle}
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>{p.summary1}</li>
          <li>{p.summary2}</li>
          <li>{p.summary3}</li>
        </ul>
        <Link href={routes.account} className={buttonClasses({ variant: "secondary", size: "sm", className: "self-start" })}>
          {p.accountLink}
        </Link>
      </Card>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="flex flex-col gap-2">
          <h2 id={`privacy-${section.id}`} className="text-xl font-semibold">
            {section.title}
          </h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p className="text-sm text-ink-muted">{p.updated}</p>
    </article>
  );
}
