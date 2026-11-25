import type { Metadata } from "next";
import { Link } from "@/components/ui/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMessage } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { routes } from "@/lib/navigation";
import { operator } from "@/config/operator";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.title };
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  const p = t.privacy;
  const sections = [
    { id: "stored", title: p.storedTitle, body: p.stored },
    { id: "health", title: p.healthTitle, body: p.health },
    { id: "not-collected", title: p.notCollectedTitle, body: p.notCollected },
    { id: "cookie", title: p.cookieTitle, body: p.cookie },
    { id: "server", title: p.serverTitle, body: p.server },
    { id: "offline", title: p.offlineTitle, body: p.offline },
    { id: "shared", title: p.sharedTitle, body: p.shared },
    { id: "rights", title: p.rightsTitle, body: p.rights },
    { id: "advice", title: p.adviceTitle, body: p.advice },
  ];
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
      {operator ? (
        <section aria-labelledby="privacy-operator" className="flex flex-col gap-2">
          <h2 id="privacy-operator" className="text-xl font-semibold">
            {p.operatorTitle}
          </h2>
          <p>{formatMessage(p.operator, { name: operator.name, country: operator.country })}</p>
          <p>
            {p.contact}{" "}
            <a href={`mailto:${operator.email}`} className="font-medium text-primary underline underline-offset-2">
              {operator.email}
            </a>
          </p>
        </section>
      ) : null}
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
