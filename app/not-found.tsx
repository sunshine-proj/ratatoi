import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

export default function NotFound() {
  const t = getMessages();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6">
      <PageHeader title={t.pages.notFound.title} intro={t.pages.notFound.body} />
      <Link href={routes.today} className={buttonClasses()}>
        {t.pages.notFound.home}
      </Link>
    </div>
  );
}
