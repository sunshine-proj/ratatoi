import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.shoppingList.title };

export default function ShoppingListPage() {
  return <PagePlaceholder title={t.pages.shoppingList.title} intro={t.pages.shoppingList.intro} icon="shopping" />;
}
