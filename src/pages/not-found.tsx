import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { LocaleProvider, useCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

const TEXT: Record<Locale, { title: string; dek: string; home: string; docTitle: string }> = {
  de: {
    title: "Diese Seite gibt es nicht.",
    dek: "Unter dieser Adresse liegt keine Seite. Zurück zur Startseite.",
    home: "Startseite",
    docTitle: "Seite nicht gefunden · TechTalkTobi",
  },
  en: {
    title: "This road is closed.",
    dek: "That page is not on this map. Head back to the site.",
    home: "Home",
    docTitle: "Page not found · TechTalkTobi",
  },
};

export function notFoundLocale(pathname: string): Locale {
  return pathname === "/de" || pathname.startsWith("/de/") ? "de" : "en";
}

/**
 * Site-wide 404. GitHub Pages serves it from 404.html, an empty SPA shell, for
 * any unknown URL. Rendering nothing until after hydration keeps the first
 * client render identical to that shell (no React #418 mismatch); then the
 * localized page with the normal header and footer appears.
 */
export function NotFoundPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  const locale = notFoundLocale(pathname);
  return (
    <LocaleProvider locale={locale}>
      <SiteShell>
        <NotFoundBody locale={locale} />
      </SiteShell>
    </LocaleProvider>
  );
}

function NotFoundBody({ locale }: { locale: Locale }) {
  const copy = useCopy();
  const text = TEXT[locale];
  useEffect(() => {
    document.title = text.docTitle;
  }, [text.docTitle]);
  return (
    <Container className="flex min-h-[60dvh] max-w-2xl flex-col justify-center gap-4 py-16">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">404</p>
      <h1 className="font-display text-4xl leading-tight text-fg sm:text-5xl">{text.title}</h1>
      <p className="text-muted">{text.dek}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/$locale" params={{ locale }}>
            {text.home}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/$locale/research" params={{ locale }}>
            {copy.nav.research}
          </Link>
        </Button>
      </div>
    </Container>
  );
}
