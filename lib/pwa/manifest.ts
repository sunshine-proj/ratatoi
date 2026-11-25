import type { MetadataRoute } from "next";
import { localePath, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/catalogue";
import { routes } from "@/lib/navigation";

/**
 * Web app manifest for one locale. Each language has its own manifest, so
 * an app installed from a Lithuanian page is named and opens in Lithuanian.
 */
export function buildManifest(locale: Locale): MetadataRoute.Manifest {
  const t = getMessages(locale);
  const path = (route: string) => localePath(locale, route);
  return {
    id: path(routes.today),
    name: t.app.name,
    short_name: t.app.shortName,
    description: t.app.description,
    lang: locale,
    dir: "ltr",
    start_url: path(routes.today),
    scope: "/",
    display: "standalone",
    // Keep in sync with --color-canvas in app/globals.css.
    background_color: "#fbf7f0",
    theme_color: "#fbf7f0",
    categories: ["food", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: t.nav.plan, url: path(routes.planner), icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: t.nav.shopping, url: path(routes.shoppingList), icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
