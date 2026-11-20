import type { Locale } from "@/lib/locale";
import { DECK_FRAME_CLASS, DeckOpenButton, DeckOpenLink } from "@/components/deck-open";
import { useLocale } from "@/lib/i18n";

/*
 * Interactive Slides' standalone MB.DRIVE ASSIST PRO deck (Nov 16 2026),
 * shipped as-is under public/research/embed/ and framed here so its own
 * styles and scripts never touch the site's. German file: original,
 * unchanged apart from robots/canonical tags. English file: translation
 * of the same file; layout, scripts, and source URLs are identical.
 * The deck is a 16:9 viewport slideshow, so the frame uses aspect-ratio
 * instead of the auto-height fit used for the Grünheide dashboard.
 */
export const MB_DRIVE_EMBED_SRC: Record<Locale, string> = {
  de: "/research/embed/mercedes-mb-drive-assist-pro.de.html",
  en: "/research/embed/mercedes-mb-drive-assist-pro.en.html",
};

const FRAME_TITLE: Record<Locale, string> = {
  de: "Interaktives Dashboard: Mercedes MB.DRIVE ASSIST PRO",
  en: "Interactive dashboard: Mercedes MB.DRIVE ASSIST PRO",
};

export function MbDriveAssistProDashboard() {
  const locale = useLocale();
  const src = MB_DRIVE_EMBED_SRC[locale];

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
