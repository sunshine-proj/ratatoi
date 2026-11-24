import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { formatMessage, getMessages, type Messages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import type { RecipeDetail as RecipeDetailData } from "@/lib/recipes/catalogue";
import { formatAmount } from "@/lib/recipes/format";
import {
  HIGH_PROTEIN_MIN_ENERGY_SHARE,
  MEAL_KCAL_LABEL_MAX,
  proteinEnergyShare,
  QUICK_MAX_MINUTES,
  SNACK_KCAL_LABEL_MAX,
  type RecipeTag,
} from "@/lib/recipes/tags";
import { AddToPlanButton } from "@/components/planner/add-to-plan-button";
import { RecipeImage } from "./recipe-image";

function tagRule(t: Messages, tag: RecipeTag): string {
  const rules = t.recipes.tagRules;
  switch (tag) {
    case "high_protein":
      return formatMessage(rules.high_protein, { percent: Math.round(HIGH_PROTEIN_MIN_ENERGY_SHARE * 100) });
    case "under_200_kcal":
      return formatMessage(rules.under_200_kcal, { kcal: SNACK_KCAL_LABEL_MAX });
    case "under_450_kcal":
      return formatMessage(rules.under_450_kcal, { kcal: MEAL_KCAL_LABEL_MAX });
    case "quick":
      return formatMessage(rules.quick, { min: QUICK_MAX_MINUTES });
    default:
      return rules[tag];
  }
}

export function RecipeDetail({ recipe }: { recipe: RecipeDetailData }) {
  const t = getMessages();
  const d = t.recipes.detail;
  const n = recipe.nutritionPerServing;
  const list = (items: string[]) => items.join(", ");

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <Link
        href={routes.recipes}
        className="inline-flex min-h-11 items-center gap-1 self-start rounded-control font-medium text-primary hover:underline"
      >
        <Icon name="chevronLeft" className="size-5" />
        {d.back}
      </Link>

      <header className="grid gap-6 md:grid-cols-2 md:items-center">
        <RecipeImage
          image={recipe.image}
          mealType={recipe.mealTypes[0]!}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          className="rounded-card"
        />
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
            {recipe.mealTypes.map((type) => t.mealTypes[type]).join(" · ")}
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">{recipe.name}</h1>
          <p className="text-lg text-ink-muted">{recipe.description}</p>
          {recipe.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{t.recipes.tags[tag]}</Tag>
                </li>
              ))}
            </ul>
          ) : null}
          <AddToPlanButton recipe={{ slug: recipe.slug, name: recipe.name, mealTypes: recipe.mealTypes }} />
          <dl aria-label={d.timesLabel} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: d.prep, value: formatMessage(d.minutes, { min: recipe.prepMinutes }) },
              { label: d.cook, value: formatMessage(d.minutes, { min: recipe.cookMinutes }) },
              { label: d.total, value: formatMessage(d.minutes, { min: recipe.totalMinutes }) },
            ].map((item) => (
              <div key={item.label} className="rounded-control bg-surface-muted px-3 py-2">
                <dt className="text-xs text-ink-muted">{item.label}</dt>
                <dd className="font-semibold">{item.value}</dd>
              </div>
            ))}
            <div className="rounded-control bg-surface-muted px-3 py-2">
              <dt className="sr-only">{d.servingsLabel}</dt>
              <dd className="flex items-center gap-1.5 font-semibold">
                <Icon name="servings" className="size-5" />
                {formatPlural(d.servings, recipe.servings)}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <Card as="section" aria-labelledby="nutrition-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="nutrition-title" className="text-xl font-semibold">
            {d.nutritionTitle}
          </h2>
          <Tag tone={recipe.nutritionIsEstimated ? "neutral" : "protein"}>
            {recipe.nutritionIsEstimated ? d.estimated : d.verified}
          </Tag>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: d.protein, value: `${formatNumber(n.proteinG)} ${d.gramsUnit}`, tone: "bg-protein-bg text-protein-fg" },
            { label: d.energy, value: `${formatNumber(n.kcal)} ${d.kcalUnit}`, tone: "bg-energy-bg text-energy-fg" },
            { label: d.carbs, value: `${formatNumber(n.carbsG)} ${d.gramsUnit}`, tone: "bg-surface-muted text-ink" },
            { label: d.fat, value: `${formatNumber(n.fatG)} ${d.gramsUnit}`, tone: "bg-surface-muted text-ink" },
          ].map((item) => (
            <div key={item.label} className={`rounded-control px-4 py-3 ${item.tone}`}>
              <dt className="text-sm">{item.label}</dt>
              <dd className="text-2xl font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-ink-muted">
          {formatMessage(d.proteinShare, { percent: Math.round(proteinEnergyShare(n) * 100) })}
        </p>
      </Card>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="ingredients-title" className="flex flex-col gap-3">
          <div>
            <h2 id="ingredients-title" className="text-2xl font-semibold">
              {d.ingredients}
            </h2>
            <p className="text-sm text-ink-muted">{formatPlural(d.ingredientsFor, recipe.servings)}</p>
          </div>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {recipe.ingredients.map((line) => (
              <li key={`${line.ingredient}-${line.unit}`} className="flex gap-3 px-4 py-2.5">
                <span className="w-24 shrink-0 font-semibold">{formatAmount(line, t)}</span>
                <span>
                  {line.name}
                  {line.note ? <span className="text-ink-muted">, {line.note}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="method-title" className="flex flex-col gap-3">
          <h2 id="method-title" className="text-2xl font-semibold">
            {d.method}
          </h2>
          <ol className="flex flex-col gap-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-primary text-sm font-semibold text-on-primary"
                >
                  {index + 1}
                </span>
                <p className="pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card as="section" aria-labelledby="allergens-title" className="flex flex-col gap-2">
          <h2 id="allergens-title" className="text-xl font-semibold">
            {d.allergensTitle}
          </h2>
          <p className="font-medium">
            {recipe.allergens.length > 0
              ? formatMessage(d.contains, { list: list(recipe.allergens.map((a) => t.preferences.allergens[a])) })
              : d.noAllergens}
          </p>
          {recipe.suitableFor.length > 0 ? (
            <p>{formatMessage(d.suitableFor, { list: list(recipe.suitableFor.map((p) => t.preferences.patterns[p])) })}</p>
          ) : null}
          <p className="text-sm text-ink-muted">{d.allergenCaveat}</p>
        </Card>

        {recipe.storageNote ? (
          <Card as="section" aria-labelledby="storage-title" className="flex flex-col gap-2">
            <h2 id="storage-title" className="text-xl font-semibold">
              {d.storageTitle}
            </h2>
            <p>{recipe.storageNote}</p>
          </Card>
        ) : null}
      </div>

      <footer className="flex flex-col gap-4 border-t border-line pt-6 text-sm text-ink-muted">
        {recipe.tags.length > 0 ? (
          <section aria-labelledby="labels-title">
            <h2 id="labels-title" className="mb-1 font-sans text-base font-semibold text-ink">
              {d.labelsTitle}
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              {recipe.tags.map((tag) => (
                <li key={tag}>{tagRule(t, tag)}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="source-title">
          <h2 id="source-title" className="mb-1 font-sans text-base font-semibold text-ink">
            {d.sourceTitle}
          </h2>
          <p>
            {formatMessage(d.recipeBy, { author: recipe.contentSource.author, licence: recipe.contentSource.licence })}
          </p>
          <p>{formatMessage(d.nutritionSource, { source: recipe.nutritionSource })}</p>
          <p>
            {recipe.image
              ? formatMessage(d.photo, { attribution: recipe.image.attribution, licence: recipe.image.licence })
              : d.noPhoto}
          </p>
        </section>
      </footer>
    </article>
  );
}
