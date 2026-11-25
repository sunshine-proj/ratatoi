"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { localeNames, localePath, locales, splitLocale, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { rememberLocale } from "@/lib/i18n/preference";

type Variant = "footer" | "settings";

/**
 * Links to this page in each language, each named in its own language.
 *
 * Plain links (full page loads), not client navigation: switching language
 * swaps the whole document (`<html lang>`, messages, service worker), and
 * clicking one remembers the choice (see lib/i18n/preference.ts).
 */
export function LanguageSwitcher({ variant }: { variant: Variant }) {
  return (
    // usePathname suspends on routes with unknown params during prerender; the
    // fallback links to each language's home page.
    <Suspense fallback={<LanguageLinks variant={variant} path="/" />}>
      <PathAwareLanguageLinks variant={variant} />
    </Suspense>
  );
}

function PathAwareLanguageLinks({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  return <LanguageLinks variant={variant} path={pathname ? splitLocale(pathname).path : "/"} />;
}

function LanguageLinks({ variant, path }: { variant: Variant; path: string }) {
  const { t, locale: current } = useI18n();
  // The footer picker is a landmark on every page. In Settings it sits in a
  // titled section, so a second "Language" landmark would only repeat it.
  const Wrapper = variant === "footer" ? "nav" : "div";
  return (
    <Wrapper aria-label={variant === "footer" ? t.language.label : undefined}>
      <ul className={cn("flex flex-wrap", variant === "footer" ? "gap-x-1" : "gap-2")}>
        {locales.map((locale: Locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <a
                href={localePath(locale, path)}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                onClick={() => rememberLocale(locale)}
                className={cn(
                  "inline-flex min-h-11 items-center",
                  variant === "footer"
                    ? cn("rounded-control px-2", active ? "font-semibold text-ink" : "text-primary underline underline-offset-2 hover:text-primary-strong")
                    : cn(
                        "rounded-pill border px-4 text-sm",
                        active
                          ? "border-primary bg-primary-soft font-semibold text-primary-strong"
                          : "border-line-strong bg-surface text-ink hover:bg-surface-muted",
                      ),
                )}
              >
                {localeNames[locale]}
              </a>
            </li>
          );
        })}
      </ul>
    </Wrapper>
  );
}
