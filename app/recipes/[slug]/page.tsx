import { Suspense } from "react";
import { ComingSoon, PageHeader } from "@/components/layout/page-header";
import { formatMessage, getMessages } from "@/lib/i18n";

const t = getMessages();

export default function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Params are runtime data under Cache Components; keep the shell static. */}
      <Suspense fallback={<PageHeader title={t.pages.recipeDetail.title} intro={t.pages.loading} />}>
        {params.then(({ slug }) => (
          <PageHeader
            title={t.pages.recipeDetail.title}
            intro={formatMessage(t.pages.recipeDetail.intro, { slug: decodeURIComponent(slug) })}
          />
        ))}
      </Suspense>
      <ComingSoon icon="recipes" />
    </div>
  );
}
