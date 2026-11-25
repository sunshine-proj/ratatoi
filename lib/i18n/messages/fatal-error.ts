import type { Locale } from "@/lib/i18n";

/**
 * The strings `app/global-error.tsx` needs, per locale. It replaces the
 * root layout, so it can't use the message provider, and importing every
 * catalogue there would ship them all to the browser. Must match
 * `pages.error` in each catalogue (checked by tests/unit/i18n).
 */
export const fatalErrorMessages: Record<Locale, { title: string; body: string; retry: string; home: string }> = {
  en: {
    title: "Something went wrong",
    body: "This page couldn't be shown. Trying again often helps.",
    retry: "Try again",
    home: "Go to Today",
  },
  lv: {
    title: "Kaut kas nogāja greizi",
    body: "Šo lapu neizdevās parādīt. Bieži palīdz mēģināt vēlreiz.",
    retry: "Mēģināt vēlreiz",
    home: "Atvērt “Šodien”",
  },
  lt: {
    title: "Kažkas nepavyko",
    body: "Šio puslapio nepavyko parodyti. Dažnai padeda bandymas dar kartą.",
    retry: "Bandyti dar kartą",
    home: "Eiti į „Šiandien“",
  },
  et: {
    title: "Midagi läks valesti",
    body: "Seda lehte ei õnnestunud kuvada. Sageli aitab uuesti proovimine.",
    retry: "Proovi uuesti",
    home: "Ava „Täna“",
  },
};
