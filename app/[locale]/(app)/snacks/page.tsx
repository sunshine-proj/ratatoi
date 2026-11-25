import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.snacks.title };
}

export default async function SnacksPage() {
  const { t, locale } = await getI18n();
  const snacks = getRecipeSummaries(locale).filter((recipe) => recipe.mealTypes.includes("snack"));
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <PageHeader title={t.pages.snacks.title} intro={t.pages.snacks.intro} />
      <RecipeBrowser recipes={snacks} mode="snacks" />
    </div>
  );
}
