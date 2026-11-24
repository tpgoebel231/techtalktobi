import { DECK_FRAME_CLASS, DeckOpenButton, DeckOpenLink } from "@/components/deck-open";

/*
 * Interactive Slides' standalone "VW und automatisiertes Fahren" deck
 * (Stand 24.11.2026, research by Kimbal), shipped as-is under
 * public/research/embed/ and framed here so its own styles and scripts
 * never touch the site's. German only for now. The source file is
 * unchanged apart from the robots tag (noindex -> noindex, follow) and
 * swapping Google Fonts for the self-hosted Inter files already used by
 * the other decks; the canonical already pointed at the research page. The deck is a 16:9 viewport slideshow, so the frame uses
 * aspect-ratio instead of the auto-height fit used for the Grünheide
 * dashboard.
 */
export const VW_AUTOMATISIERTES_FAHREN_EMBED_SRC =
  "/research/embed/vw-automatisiertes-fahren.de.html";

const FRAME_TITLE = "Interaktives Dashboard: VW und automatisiertes Fahren";

export function VwAutomatisiertesFahrenDashboard() {
  const src = VW_AUTOMATISIERTES_FAHREN_EMBED_SRC;

  return (
    <div className="flex flex-col gap-3">
      <DeckOpenButton href={src} />
      <div className="overflow-hidden rounded-xl bg-[#15181d] shadow-[var(--shadow-border)]">
        <iframe
          key={src}
          src={src}
          title={FRAME_TITLE}
          className={DECK_FRAME_CLASS}
        />
      </div>
      <DeckOpenLink href={src} />
    </div>
  );
}
