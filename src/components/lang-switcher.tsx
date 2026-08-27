import { useRouter, useRouterState } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { useCopy, useLocale } from "@/lib/i18n";
import { switchLocalePath, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

const US_STARS: Array<[number, number]> = [];
for (let row = 0; row < 9; row++) {
  const count = row % 2 === 0 ? 6 : 5;
  const y = 210 + row * 210;
  const x0 = row % 2 === 0 ? 247 : 494;
  for (let col = 0; col < count; col++) {
    US_STARS.push([x0 + col * 494, y]);
  }
}

function FlagEn() {
  return (
    <svg
      viewBox="0 0 7410 3900"
      width={18}
      height={12}
      aria-hidden="true"
      focusable="false"
      className="block h-3 w-[18px] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(237,235,230,0.28)]"
    >
      <rect width="7410" height="3900" fill="#B22234" />
      <path
        stroke="#FFF"
        strokeWidth={300}
        d="M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410"
      />
      <rect width="2964" height="2100" fill="#3C3B6E" />
      {US_STARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={90} fill="#FFF" />
      ))}
    </svg>
  );
}

function FlagDe() {
  return (
    <svg
      viewBox="0 0 5 3"
      width={18}
      height={12}
      aria-hidden="true"
      focusable="false"
      className="block h-3 w-[18px] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(237,235,230,0.28)]"
    >
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCE00" />
    </svg>
  );
}

function Flag({ code }: { code: Locale }) {
  return code === "en" ? <FlagEn /> : <FlagDe />;
}

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const copy = useCopy();
  const router = useRouter();
  const href = useRouterState({ select: (s) => s.location.href });

  function hrefFor(next: Locale) {
    return switchLocalePath(href, next);
  }

  function go(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    if (next === locale) {
      event.preventDefault();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    void router.navigate({ href: hrefFor(next) });
  }

  return (
    <div
      className={cn("inline-flex items-center rounded-full bg-surface-2 p-1", className)}
      role="group"
      aria-label={copy.lang.label}
    >
      {(["en", "de"] as const).map((code) => {
        const active = locale === code;
        return (
          <a
            key={code}
            href={hrefFor(code)}
            hrefLang={code}
            lang={code}
            onClick={(event) => go(event, code)}
            className={cn(
              "inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 font-mono text-xs tracking-wide no-underline transition-colors duration-150",
              active ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
            aria-current={active ? "true" : undefined}
          >
            <Flag code={code} />
            <span className="sr-only">{LOCALE_NAME[code]}</span>
          </a>
        );
      })}
    </div>
  );
}
