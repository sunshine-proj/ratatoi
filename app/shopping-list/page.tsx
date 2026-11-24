import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { getMessages } from "@/lib/i18n";
import { getRecipeIngredientIndex, getRecipeSummaries } from "@/lib/recipes/catalogue";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.shoppingList.title };

export default function ShoppingListPage() {
  const recipeNames = Object.fromEntries(getRecipeSummaries().map((recipe) => [recipe.slug, recipe.name]));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={t.pages.shoppingList.title} intro={t.pages.shoppingList.intro} />
      <ShoppingListView recipeIndex={getRecipeIngredientIndex()} recipeNames={recipeNames} />
    </div>
  );
}
