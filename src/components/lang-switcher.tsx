import { useRouter, useRouterState } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import { useCopy, useLocale } from "@/lib/i18n";
import { switchLocalePath, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

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
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    void router.navigate({ href: hrefFor(next) });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-surface-2 p-1",
        className,
      )}
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
            {copy.lang[code]}
          </a>
        );
      })}
    </div>
  );
}
