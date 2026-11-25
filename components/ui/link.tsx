"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

/**
 * `next/link` that keeps people in their language: internal paths get the
 * current locale's prefix (`/recipes` → `/lt/recipes`). Pass `locale` to
 * link to another language (the language picker does).
 */
export function Link({ href, locale, ...props }: Omit<ComponentProps<typeof NextLink>, "href" | "locale"> & {
  href: string;
  locale?: Parameters<typeof localePath>[0];
}) {
  const { locale: current } = useI18n();
  return <NextLink href={localePath(locale ?? current, href)} {...props} />;
}
