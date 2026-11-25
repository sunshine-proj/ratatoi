import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, localePath, matchAcceptLanguage, splitLocale } from "@/lib/i18n";
import { routes } from "@/lib/navigation";
import { recipeSlugs } from "@/lib/recipes/slugs";

/**
 * Language routing, plus real 404s for unknown pages and recipes.
 *
 * 1. English lives at unprefixed URLs (`/recipes`), rewritten internally to
 *    `/en/recipes`. `/en/...` itself redirects to the unprefixed URL, so
 *    each page has one address.
 * 2. Latvian, Lithuanian, and Estonian live under `/lv`, `/lt`, `/et`.
 * 3. Opening an unprefixed page goes to the person's language: the one
 *    they chose in the app (cookie), or else the browser's preferred
 *    language. Only top-level page loads are redirected, never the
 *    service worker's or the router's own requests.
 * 4. Paths with no page, and unknown recipe slugs, are rewritten to the
 *    locale's prerendered 404 page (`/[locale]/missing`). Checking here,
 *    before rendering, gives a real 404 status: with Cache Components a
 *    recipe page would otherwise send its prerendered shell (and a 200)
 *    before `notFound()` runs.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  const { locale, path, prefixed } = splitLocale(pathname);

  if (!prefixed && isTopLevelPageLoad(request)) {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred = isLocale(chosen) ? chosen : matchAcceptLanguage(request.headers.get("accept-language"));
    if (preferred && preferred !== defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = localePath(preferred, path);
      const response = NextResponse.redirect(url, 307);
      // The answer depends on these, so shared caches must not reuse it.
      response.headers.set("Vary", "Cookie, Accept-Language");
      return response;
    }
  }

  if (!isKnownPage(path)) {
    return NextResponse.rewrite(new URL(`/${locale}/missing`, request.url));
  }

  if (!prefixed) {
    return NextResponse.rewrite(new URL(`/${defaultLocale}${pathname === "/" ? "" : pathname}${search}`, request.url));
  }
  return NextResponse.next();
}

/** A document navigation by the person (not a fetch, prefetch, or the service worker). */
function isTopLevelPageLoad(request: NextRequest): boolean {
  return (
    request.method === "GET" &&
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document" &&
    !request.headers.has("rsc")
  );
}

const staticPages = new Set<string>(Object.values(routes).filter((route) => typeof route === "string"));

/** Whether a locale-free path is one of the app's pages (or the manifest). */
function isKnownPage(path: string): boolean {
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (staticPages.has(normalized) || normalized === "/manifest.webmanifest") return true;
  const recipe = /^\/recipes\/([^/]+)$/.exec(normalized);
  return recipe !== null && recipeSlugs.has(safeDecode(recipe[1]!));
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const config = {
  matcher: [
    // Pages: skip Next.js internals, the API, and files with an extension
    // (icons, images, sw.js, and the prefixed manifests).
    "/((?!_next/|api/|.*\\.[^/]+$).*)",
    // The English manifest, rewritten to /en/manifest.webmanifest.
    "/manifest.webmanifest",
  ],
};
