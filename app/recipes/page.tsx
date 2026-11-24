import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { getMessages } from "@/lib/i18n";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.recipes.title };

export default function RecipesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <PageHeader title={t.pages.recipes.title} intro={t.pages.recipes.intro} />
      <RecipeBrowser recipes={getRecipeSummaries()} mode="all" />
    </div>
  );
}
