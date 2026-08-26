import { fsdMatrix } from "@/data/research";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function FsdMatrix() {
  const locale = useLocale();

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <ul className="divide-y divide-border">
        {fsdMatrix.map((row) => (
          <li
            key={row.id}
            className="grid gap-3 px-5 py-5 sm:grid-cols-12 sm:items-start"
          >
            <div className="sm:col-span-4">
              <p className="font-medium text-fg">{row.label[locale]}</p>
              <Score value={row.score} />
            </div>
            <p className="text-sm leading-relaxed text-muted sm:col-span-8">
              {row.note[locale]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Score({ value }: { value: number }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn(
              "size-2 rounded-full",
              n <= value ? "bg-accent" : "bg-surface-2",
            )}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-faint tabular-nums">
        {value}/5
      </span>
    </div>
  );
}
