import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { getRecipeDetail, getRecipeDetails } from "@/lib/recipes/catalogue";

/** Every seed recipe is prerendered; unknown slugs render the not-found page. */
export function generateStaticParams() {
  return getRecipeDetails().map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipeDetail(slug);
  return recipe ? { title: recipe.name, description: recipe.description } : {};
}

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  const recipe = getRecipeDetail(slug);
  if (!recipe) notFound();
  return <RecipeDetail recipe={recipe} />;
}
