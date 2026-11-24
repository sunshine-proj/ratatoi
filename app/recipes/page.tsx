import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.recipes.title };

export default function RecipesPage() {
  return <PagePlaceholder title={t.pages.recipes.title} intro={t.pages.recipes.intro} icon="recipes" />;
}
