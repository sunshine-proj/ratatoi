import { NextResponse, type NextRequest } from "next/server";
import { recipeSlugs } from "@/lib/recipes/slugs";

/**
 * Unknown recipe slugs get a real 404 status.
 *
 * With Cache Components, a recipe page sends its prerendered shell (and a
 * 200 status) before `notFound()` can run, so missing recipes would be
 * "soft 404s". Checking the slug here, before rendering, and rewriting to a
 * path with no route makes Next.js render the not-found page with a 404,
 * while the browser keeps the requested URL.
 */
export function proxy(request: NextRequest) {
  const slug = decodeURIComponent(request.nextUrl.pathname.slice("/recipes/".length));
  if (recipeSlugs.has(slug)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_missing-recipe", request.url));
}

export const config = {
  // Single-segment recipe detail routes only.
  matcher: "/recipes/:slug",
};
