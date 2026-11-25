import { notFound } from "next/navigation";

/**
 * The 404 page, in every language. proxy.ts rewrites any path that matches
 * no page (and unknown recipe slugs) here, so not-found keeps the app shell
 * and the page's language, with a real 404 status.
 *
 * It's static and outside the (app) route group on purpose: Next.js
 * prerenders it as a complete 404 page. (Inside (app)/loading.tsx's
 * Suspense boundary, or as a catch-all with unknown params, the not-found
 * UI would only be rendered in the browser.)
 */
export default function MissingPage() {
  notFound();
}
