import { robotFirms } from "@/data/research";
import { useLocale } from "@/lib/i18n";

export function RoboticsMap() {
  const locale = useLocale();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {robotFirms.map((firm) => (
        <article
          key={firm.name}
          className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        >
          <p className="font-mono text-[11px] tracking-wide text-faint uppercase">
            {firm.hq[locale]}
          </p>
          <h3 className="mt-1 text-lg font-medium text-fg">{firm.name}</h3>
          <p className="mt-2 text-sm text-muted">{firm.stack[locale]}</p>
          <p className="mt-3 text-sm text-fg">{firm.status[locale]}</p>
        </article>
      ))}
    </div>
  );
}
