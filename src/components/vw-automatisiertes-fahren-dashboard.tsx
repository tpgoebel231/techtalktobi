import type { Locale } from "@/lib/locale";
import { DECK_FRAME_CLASS, DeckOpenButton, DeckOpenLink } from "@/components/deck-open";
import { useLocale } from "@/lib/i18n";

/*
 * Interactive Slides' standalone "VW und automatisiertes Fahren" /
 * "VW and Automated Driving" deck (as of 24 Nov 2026, research by
 * Kimbal), shipped as-is under public/research/embed/ and framed here
 * so its own styles and scripts never touch the site's. German file:
 * original, unchanged apart from the robots tag (noindex -> noindex,
 * follow) and swapping Google Fonts for the self-hosted Inter files
 * already used by the other decks. English file: translation of the
 * same file; layout, scripts, and source URLs are identical. The deck
 * is a 16:9 viewport slideshow, so the frame uses aspect-ratio instead
 * of the auto-height fit used for the Grünheide dashboard.
 */
export const VW_AUTOMATISIERTES_FAHREN_EMBED_SRC: Record<Locale, string> = {
  de: "/research/embed/vw-automatisiertes-fahren.de.html",
  en: "/research/embed/vw-automatisiertes-fahren.en.html",
};

const FRAME_TITLE: Record<Locale, string> = {
  de: "Interaktives Dashboard: VW und automatisiertes Fahren",
  en: "Interactive dashboard: VW and Automated Driving",
};

export function VwAutomatisiertesFahrenDashboard() {
  const locale = useLocale();
  const src = VW_AUTOMATISIERTES_FAHREN_EMBED_SRC[locale];

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
