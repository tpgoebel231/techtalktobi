import type { Locale } from "@/lib/locale";
import { DECK_FRAME_CLASS, DeckOpenButton, DeckOpenLink } from "@/components/deck-open";
import { useLocale } from "@/lib/i18n";

/*
 * Interactive Slides' standalone "Wie sicher sind Tesla Model 3 und Model Y?"
 * / "How Safe Are the Tesla Model 3 and Model Y?" deck (as of November 2026),
 * shipped under public/research/embed/ and framed here so its own styles and
 * scripts never touch the site's. German file: the original, with the robots
 * tag changed (noindex -> noindex, follow), a canonical to the research page,
 * and the Google Fonts request swapped for the self-hosted Inter files already
 * used by the other decks. English file: translation of the same deck data and
 * code with English number and date formats; layout, scripts, and source URLs
 * are identical. The deck is a 16:9 viewport slideshow, so the frame uses
 * aspect-ratio instead of the auto-height fit used for the Grünheide
 * dashboard.
 */
export const TESLA_SICHERHEIT_MODEL_3_Y_EMBED_SRC: Record<Locale, string> = {
  de: "/research/embed/tesla-sicherheit-model-3-y.de.html",
  en: "/research/embed/tesla-sicherheit-model-3-y.en.html",
};

const FRAME_TITLE: Record<Locale, string> = {
  de: "Interaktives Dashboard: Wie sicher sind Tesla Model 3 und Model Y?",
  en: "Interactive dashboard: How Safe Are the Tesla Model 3 and Model Y?",
};

export function TeslaSicherheitModel3YDashboard() {
  const locale = useLocale();
  const src = TESLA_SICHERHEIT_MODEL_3_Y_EMBED_SRC[locale];

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
