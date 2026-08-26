import { waymoCities } from "@/data/research";
import { useLocale } from "@/lib/i18n";

export function WaymoTracker() {
  const locale = useLocale();

  return (
    <ol className="relative space-y-0 border-l border-border pl-6">
      {waymoCities.map((city) => (
        <li key={city.city.en} className="relative pb-8 last:pb-0">
          <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-accent" />
          <p className="font-mono text-[11px] tracking-wide text-faint uppercase">
            {city.since} · {city.mode[locale]}
          </p>
          <h3 className="mt-1 font-display text-2xl text-fg">
            {city.city[locale]}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {city.note[locale]}
          </p>
        </li>
      ))}
    </ol>
  );
}
