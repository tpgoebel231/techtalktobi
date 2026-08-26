import { useLocation, useNavigate } from "@tanstack/react-router";
import { useCopy, useLocale } from "@/lib/i18n";
import { switchLocalePath, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const copy = useCopy();
  const location = useLocation();
  const navigate = useNavigate();

  function go(next: Locale) {
    if (next === locale) return;
    void navigate({ to: switchLocalePath(location.pathname, next) });
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
      {(["en", "de"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => go(code)}
          className={cn(
            "h-9 min-w-11 rounded-full px-3 font-mono text-xs tracking-wide transition-colors duration-150",
            locale === code
              ? "bg-fg text-bg"
              : "text-muted hover:text-fg",
          )}
          aria-pressed={locale === code}
        >
          {copy.lang[code]}
        </button>
      ))}
    </div>
  );
}
