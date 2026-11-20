import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { useLocale } from "@/lib/i18n";

const OPEN_DECK: Record<Locale, string> = {
  de: "Deck öffnen",
  en: "Open deck",
};

const OPEN_FULL: Record<Locale, string> = {
  de: "Dashboard im Vollbild öffnen",
  en: "Open the dashboard full screen",
};

/**
 * Big "Open deck" button shown above an embedded deck on phones only
 * (same tab; the deck file is on this site, Back returns here).
 */
export function DeckOpenButton({ href }: { href: string }) {
  const locale = useLocale();
  return (
    <Button asChild size="lg" className="w-full sm:hidden">
      <a href={href}>
        <Maximize2 className="size-4" aria-hidden="true" />
        {OPEN_DECK[locale]}
      </a>
    </Button>
  );
}

/** Small full-screen link under the frame on tablet and desktop. */
export function DeckOpenLink({ href }: { href: string }) {
  const locale = useLocale();
  return (
    <a href={href} className="hidden self-end text-sm text-accent sm:inline">
      {OPEN_FULL[locale]}
    </a>
  );
}

/**
 * Frame height for 16:9 slide decks: 16:9 from `sm` up; on phones the decks
 * reflow into a tall single column, so give the frame most of the screen.
 */
export const DECK_FRAME_CLASS =
  "block w-full border-0 h-[78svh] min-h-[520px] max-h-[860px] sm:h-auto sm:min-h-0 sm:max-h-none sm:aspect-video";
