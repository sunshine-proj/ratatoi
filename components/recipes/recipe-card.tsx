"use client";

import { Link } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { AddToPlanButton } from "@/components/planner/add-to-plan-button";
import { RecipeImage } from "./recipe-image";

/** The card is one link (the title, stretched) plus a separate "Add to plan" button. */
export function RecipeCard({ recipe, priority }: { recipe: RecipeSummary; priority?: boolean }) {
  const { t, locale } = useI18n();
  const n = recipe.nutritionPerServing;

  return (
    // Phones: compact horizontal card (image left) so the list stays scannable;
    // from sm up: photo-led card with the image on top.
    <article className="group relative flex w-full flex-row overflow-hidden sm:flex-col rounded-card border border-line bg-surface shadow-card transition-shadow has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus hover:shadow-raised">
      <RecipeImage
        image={recipe.image}
        mealType={recipe.mealTypes[0]!}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 112px"
        priority={priority}
        className="w-28 shrink-0 self-start sm:w-auto sm:self-auto"
      />
      {/* Sits above the card's stretched link, so it is its own tab stop. */}
      {/* On the image's corner: top-left on phones (image is beside the text), top-right above. */}
      <div className="absolute top-2 left-2 sm:top-3 sm:right-3 sm:left-auto">
        <AddToPlanButton variant="icon" recipe={{ slug: recipe.slug, name: recipe.name, mealTypes: recipe.mealTypes }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {recipe.mealTypes.map((type) => t.mealTypes[type]).join(" · ")}
        </p>
        <h3 className="text-lg leading-snug font-semibold sm:text-xl">
          <Link
            href={routes.recipe(recipe.slug)}
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline"
          >
            {recipe.name}
          </Link>
        </h3>
        <p className="hidden text-sm text-ink-muted sm:line-clamp-2">{recipe.description}</p>

        <div className="mt-auto flex flex-col gap-2">
          <ul className="flex flex-wrap items-center gap-1.5 sm:gap-2" aria-label={recipe.nutritionIsEstimated ? t.recipes.card.perServing : t.recipes.card.perServingVerified}>
            <li>
              <Tag tone="protein">{formatMessage(t.recipes.card.protein, { g: formatNumber(n.proteinG, locale) })}</Tag>
            </li>
            <li>
              <Tag tone="energy">{formatMessage(t.recipes.card.kcal, { kcal: formatNumber(n.kcal, locale) })}</Tag>
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
