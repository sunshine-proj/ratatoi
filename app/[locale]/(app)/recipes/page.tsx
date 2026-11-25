import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.recipes.title };
}

export default async function RecipesPage() {
  const { t, locale } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <PageHeader title={t.pages.recipes.title} intro={t.pages.recipes.intro} />
      <RecipeBrowser recipes={getRecipeSummaries(locale)} mode="all" />
    </div>
  );
}
