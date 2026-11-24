import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale, getMessages } from "@/lib/i18n";
import "./globals.css";

/*
 * Fonts use `display: "optional"`: a web font is used only if it's ready
 * almost immediately (it's preloaded, and cached offline by the service
 * worker after the first visit). Otherwise the size-adjusted fallback stays
 * for that page view, so text never re-renders late. That keeps Largest
 * Contentful Paint at first paint and avoids layout shift from font swaps.
 */

// latin-ext covers Lithuanian (ą, č, ę, ė, į, š, ų, ū, ž).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "optional",
});

// Display font for headings only, not preloaded so it doesn't compete with
// the page's own resources on slow connections.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  preload: false,
  display: "optional",
});

const t = getMessages(defaultLocale);

export const metadata: Metadata = {
  applicationName: t.app.name,
  title: { default: t.app.name, template: `%s · ${t.app.name}` },
  description: t.app.description,
  appleWebApp: { capable: true, title: t.app.shortName, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Matches --color-canvas so the browser chrome blends with the top bar.
  themeColor: "#fbf7f0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Lets the layout use env(safe-area-inset-*) on notched phones.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={defaultLocale}
      className={`${geistSans.variable} ${fraunces.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
