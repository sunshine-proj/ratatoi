import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { buildManifest } from "@/lib/pwa/manifest";

/**
 * /manifest.webmanifest (English, via proxy.ts) and /lv/, /lt/, /et/
 * manifest.webmanifest. Built at compile time.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: RouteContext<"/[locale]/manifest.webmanifest">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return Response.json(buildManifest(locale), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
