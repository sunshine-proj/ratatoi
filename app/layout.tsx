import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale, getMessages } from "@/lib/i18n";
import "./globals.css";

// latin-ext covers Lithuanian (ą, č, ę, ė, į, š, ų, ū, ž).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
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
