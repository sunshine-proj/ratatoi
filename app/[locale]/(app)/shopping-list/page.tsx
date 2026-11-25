import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeIngredientIndex, getRecipeSummaries } from "@/lib/recipes/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.shoppingList.title };
}

export default async function ShoppingListPage() {
  const { t, locale } = await getI18n();
  const recipeNames = Object.fromEntries(getRecipeSummaries(locale).map((recipe) => [recipe.slug, recipe.name]));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={t.pages.shoppingList.title} intro={t.pages.shoppingList.intro} />
      <ShoppingListView recipeIndex={getRecipeIngredientIndex()} recipeNames={recipeNames} />
    </div>
  );
}
