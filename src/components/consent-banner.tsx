import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_STORAGE_KEY } from "@/data/analytics";
import { useLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

/** Footer link fires this to reopen the banner. */
export const CONSENT_OPEN_EVENT = "ttt-consent-open";

export const CONSENT_TEXT: Record<
  Locale,
  { label: string; body: string; privacy: string; accept: string; decline: string; settings: string }
> = {
  en: {
    label: "Analytics consent",
    body: "This site uses Google Analytics to count visits, but only if you agree. You can change your choice at any time in the footer.",
    privacy: "Privacy policy",
    accept: "Accept",
    decline: "Decline",
    settings: "Cookie settings",
  },
  de: {
    label: "Einwilligung zur Statistik",
    body: "Diese Seite nutzt Google Analytics, um Besuche zu zählen, aber nur, wenn du zustimmst. Deine Wahl kannst du jederzeit im Footer ändern.",
    privacy: "Datenschutz",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    settings: "Cookie-Einstellungen",
  },
};

type Choice = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __tttLoadGa?: () => void;
  }
}

function readChoice(): Choice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Private mode: the choice holds for this page view only.
  }
}

/** Remove GA cookies after a visitor withdraws consent. */
function clearGaCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
    if (name !== "_ga" && !name.startsWith("_ga_")) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function ConsentBanner() {
  const locale = useLocale();
  const text = CONSENT_TEXT[locale];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // After hydration only, so server and client HTML match.
    if (readChoice() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;

  const accept = () => {
    saveChoice("granted");
    window.__tttLoadGa?.();
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    setOpen(false);
  };
  const decline = () => {
    saveChoice("denied");
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    clearGaCookies();
    setOpen(false);
  };

  return (
    <section
      role="region"
      aria-label={text.label}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl bg-surface-2 p-5 shadow-[var(--shadow-border)] sm:inset-x-6 sm:bottom-6 print:hidden"
    >
      <p className="text-sm leading-relaxed text-fg">
        {text.body}{" "}
        <a href="/privacy" className="text-accent underline-offset-2 hover:underline">
          {text.privacy}
        </a>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={decline}>
          {text.decline}
        </Button>
        <Button variant="outline" onClick={accept}>
          {text.accept}
        </Button>
      </div>
    </section>
  );
}

export function ConsentSettingsLink({ className }: { className?: string }) {
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className}
    >
      {CONSENT_TEXT[locale].settings}
    </button>
  );
}
