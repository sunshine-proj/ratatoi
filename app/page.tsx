import { getMessages } from "@/lib/i18n";

export default function Home() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t.home.title}</h1>
      <p className="text-lg">{t.home.comingSoon}</p>
      <p className="text-sm">{t.home.disclaimer}</p>
    </main>
  );
}
