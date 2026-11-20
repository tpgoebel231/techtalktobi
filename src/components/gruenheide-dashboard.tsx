import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { DeckOpenButton, DeckOpenLink } from "@/components/deck-open";
import { useLocale } from "@/lib/i18n";

/*
 * Tobias's standalone Giga Berlin / Optimus dashboard (Nov 10 2026), shipped
 * as-is under public/research/embed/ and framed here so its Tailwind CDN,
 * Chart.js and Font Awesome never touch the site's own styles.
 * German file: Tobias's original, unchanged apart from robots/canonical tags.
 * English file: translation of the same file; data values are identical.
 */
export const GRUENHEIDE_EMBED_SRC: Record<Locale, string> = {
  de: "/research/embed/tesla-gruenheide.de.html",
  en: "/research/embed/tesla-gruenheide.en.html",
};

const FRAME_TITLE: Record<Locale, string> = {
  de: "Interaktives Dashboard: Giga Berlin Belegschaft & Optimus 10-Jahres-Projektion",
  en: "Interactive dashboard: Giga Berlin workforce & Optimus 10-year projection",
};

const INITIAL_HEIGHT = 1500;

export function GruenheideDashboard() {
  const locale = useLocale();
  const src = GRUENHEIDE_EMBED_SRC[locale];
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(INITIAL_HEIGHT);
  const cleanup = useRef<(() => void) | null>(null);

  // Same-origin frame: size it to its content so the page scrolls, not the frame.
  const fit = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow as (Window & typeof globalThis) | null | undefined;
    if (!doc?.body || !win) return;
    // The file uses min-h-screen on <body>; inside an auto-height frame that
    // would pin the frame to its own height, so drop it here only.
    doc.documentElement.style.height = "auto";
    doc.body.style.minHeight = "0";
    const measure = () => {
      const next = Math.ceil(doc.body.getBoundingClientRect().height);
      if (next > 0) setHeight(next);
    };
    measure();
    if (typeof win.ResizeObserver === "function") {
      const observer = new win.ResizeObserver(measure);
      observer.observe(doc.body);
      cleanup.current = () => observer.disconnect();
    } else {
      const timer = win.setInterval(measure, 500);
      cleanup.current = () => win.clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    // Frame may finish loading before hydration attaches onLoad.
    const doc = frameRef.current?.contentDocument;
    if (doc?.readyState === "complete" && doc.body?.childElementCount) fit();
    return () => cleanup.current?.();
  }, [fit, src]);

  return (
    <div className="flex flex-col gap-3">
      <DeckOpenButton href={src} />
      <div className="overflow-hidden rounded-xl bg-[#F4F6F8] shadow-[var(--shadow-border)]">
        <iframe
          ref={frameRef}
          key={src}
          src={src}
          title={FRAME_TITLE[locale]}
          onLoad={fit}
          className="block w-full border-0"
          style={{ height }}
        />
      </div>
      <DeckOpenLink href={src} />
    </div>
  );
}
