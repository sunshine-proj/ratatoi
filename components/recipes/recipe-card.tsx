import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { RecipeImage } from "./recipe-image";

/** Whole card is one link (the title, stretched), so it is a single tab stop. */
export function RecipeCard({ recipe, priority }: { recipe: RecipeSummary; priority?: boolean }) {
  const t = getMessages();
  const n = recipe.nutritionPerServing;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-focus hover:shadow-raised">
      <RecipeImage
        image={recipe.image}
        mealType={recipe.mealTypes[0]!}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
        priority={priority}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {recipe.mealTypes.map((type) => t.mealTypes[type]).join(" · ")}
        </p>
        <h3 className="text-xl leading-snug font-semibold">
          <Link
            href={routes.recipe(recipe.slug)}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline"
          >
            {recipe.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{recipe.description}</p>

        <div className="mt-auto flex flex-col gap-2">
          <ul className="flex flex-wrap items-center gap-2" aria-label={recipe.nutritionIsEstimated ? t.recipes.card.perServing : t.recipes.card.perServingVerified}>
            <li>
              <Tag tone="protein">{formatMessage(t.recipes.card.protein, { g: formatNumber(n.proteinG) })}</Tag>
            </li>
            <li>
              <Tag tone="energy">{formatMessage(t.recipes.card.kcal, { kcal: formatNumber(n.kcal) })}</Tag>
            </li>
            <li className="inline-flex items-center gap-1 text-sm text-ink-muted">
              <Icon name="clock" className="size-4" />
              {formatMessage(t.recipes.card.minutes, { min: recipe.totalMinutes })}
            </li>
          </ul>
          <p className="text-xs text-ink-muted">
            {recipe.nutritionIsEstimated ? t.recipes.card.perServing : t.recipes.card.perServingVerified}
          </p>
          {recipe.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <li key={tag}>
                  <Tag className="text-xs">{t.recipes.tags[tag]}</Tag>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
