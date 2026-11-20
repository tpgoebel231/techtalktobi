import type { Locale } from "@/lib/locale";
import { DECK_FRAME_CLASS, DeckOpenButton, DeckOpenLink } from "@/components/deck-open";
import { useLocale } from "@/lib/i18n";

/*
 * Interactive Slides' standalone TÜV & ADAC EV Tests deck (Nov 19 2026),
 * shipped as-is under public/research/embed/ and framed here so its own
 * styles and scripts never touch the site's. German file: original,
 * unchanged apart from robots/canonical tags. English file: translation
 * of the same file; layout, scripts, and source URLs are identical.
 * The deck is a 16:9 viewport slideshow, so the frame uses aspect-ratio
 * instead of the auto-height fit used for the Grünheide dashboard.
 */
export const TUEV_ADAC_EMBED_SRC: Record<Locale, string> = {
  de: "/research/embed/tuev-adac-ev-tests.de.html",
  en: "/research/embed/tuev-adac-ev-tests.en.html",
};

const FRAME_TITLE: Record<Locale, string> = {
  de: "Interaktives Dashboard: TÜV & ADAC E-Auto-Tests",
  en: "Interactive dashboard: TÜV & ADAC EV Tests",
};

export function TuevAdacEvTestsDashboard() {
  const locale = useLocale();
  const src = TUEV_ADAC_EMBED_SRC[locale];

  return (
    <div className="flex flex-col gap-3">
      <DeckOpenButton href={src} />
      <div className="overflow-hidden rounded-xl bg-[#15181d] shadow-[var(--shadow-border)]">
        <iframe
          key={src}
          src={src}
          title={FRAME_TITLE[locale]}
          className={DECK_FRAME_CLASS}
        />
      </div>
      <DeckOpenLink href={src} />
    </div>
  );
}
