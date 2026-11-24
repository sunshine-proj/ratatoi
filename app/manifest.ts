import type { MetadataRoute } from "next";
import { defaultLocale, getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

const t = getMessages(defaultLocale);

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: t.app.name,
    short_name: t.app.shortName,
    description: t.app.description,
    lang: defaultLocale,
    dir: "ltr",
    start_url: routes.today,
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
      { name: t.nav.plan, url: routes.planner, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: t.nav.shopping, url: routes.shoppingList, icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
