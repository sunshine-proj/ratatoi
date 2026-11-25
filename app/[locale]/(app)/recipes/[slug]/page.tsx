import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeDetail, getRecipeDetails } from "@/lib/recipes/catalogue";
import { defaultLocale } from "@/lib/i18n";

/** Every seed recipe is prerendered in every language; unknown slugs render the not-found page. */
export function generateStaticParams() {
  // Slugs are the same in every language.
  return getRecipeDetails(defaultLocale).map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const recipe = getRecipeDetail(slug, locale);
  return recipe ? { title: recipe.name, description: recipe.description } : {};
}

export default async function RecipePage({ params }: PageProps<"/[locale]/recipes/[slug]">) {
  const { slug } = await params;
  const { locale } = await getI18n();
  const recipe = getRecipeDetail(slug, locale);
  if (!recipe) notFound();
  return <RecipeDetail recipe={recipe} />;
}
