import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { getMessages } from "@/lib/i18n";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.snacks.title };

export default function SnacksPage() {
  const snacks = getRecipeSummaries().filter((recipe) => recipe.mealTypes.includes("snack"));
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <PageHeader title={t.pages.snacks.title} intro={t.pages.snacks.intro} />
      <RecipeBrowser recipes={snacks} mode="snacks" />
    </div>
  );
}
