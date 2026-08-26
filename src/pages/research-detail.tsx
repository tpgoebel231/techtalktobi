import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/container";
import { FsdMatrix } from "@/components/fsd-matrix";
import { FsdPriceChart } from "@/components/fsd-price-chart";
import { ResearchCard } from "@/components/research-card";
import { RoboticsMap } from "@/components/robotics-map";
import { SpeedSafetyTool } from "@/components/speed-safety-tool";
import { Badge } from "@/components/ui/badge";
import { WaymoTracker } from "@/components/waymo-tracker";
import {
  getResearch,
  research,
  type ResearchSlug,
} from "@/data/research";
import { useCopy, useLocale } from "@/lib/i18n";

export function ResearchDetailPage({ slug }: { slug: ResearchSlug }) {
  const locale = useLocale();
  const copy = useCopy();
  const piece = getResearch(slug)!;
  const related = research.filter((item) => item.slug !== slug).slice(0, 3);
  const widget = widgetFor(slug);
  const hoistWidget = piece.kind !== "essay";

  return (
    <article>
      <Container className="py-10 sm:py-16">
        <Link
          to="/$locale/research"
          params={{ locale }}
          className="inline-flex h-11 items-center gap-2 text-sm text-muted no-underline hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {copy.research.back}
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Badge>{copy.research.kinds[piece.kind]}</Badge>
          <span className="font-mono text-xs text-faint tabular-nums">
            {piece.date}
          </span>
        </div>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-fg sm:text-6xl">
          {piece.title[locale]}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{piece.dek[locale]}</p>
      </Container>

      {hoistWidget && widget ? (
        <Container className="pb-12">{widget}</Container>
      ) : null}

      <div className="overflow-hidden">
        <img
          src={piece.image}
          alt=""
          className="max-h-80 w-full object-cover"
        />
      </div>

      <Container className="max-w-3xl py-12 sm:py-16">
        <div className="flex flex-col gap-6">
          {piece.paragraphs.map((p) => (
            <p key={p.en} className="text-base leading-relaxed text-fg">
              {p[locale]}
            </p>
          ))}
        </div>
        {!hoistWidget && widget ? (
          <div className="mt-10 max-w-none">{widget}</div>
        ) : null}
      </Container>

      <Container className="border-t border-border py-16">
        <h2 className="font-display text-2xl text-fg">{copy.research.related}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {related.map((item) => (
            <ResearchCard key={item.slug} piece={item} />
          ))}
        </div>
      </Container>
    </article>
  );
}

function widgetFor(slug: ResearchSlug) {
  switch (slug) {
    case "speed-vs-safety":
      return <SpeedSafetyTool />;
    case "fsd-matrix":
      return <FsdMatrix />;
    case "tesla-ecosystem":
      return <FsdPriceChart />;
    case "ai-robotics":
      return <RoboticsMap />;
    case "waymo":
      return <WaymoTracker />;
    case "self-driving":
      return <SaeTable />;
  }
}

function SaeTable() {
  const locale = useLocale();
  const rows =
    locale === "de"
      ? [
          ["SAE L0–L1", "Assistenz", "Mensch fährt, System hilft."],
          ["SAE L2", "Teilautomatisiert", "Mensch bleibt Fahrer — Teslas FSD Supervised sitzt hier, egal wie gut es fährt."],
          ["SAE L3", "Bedingt automatisiert", "System fährt in der ODD, Mensch muss übernahmefähig sein. In DE rechtlich der spannende Fall."],
          ["SAE L4", "Hochautomatisiert", "Kein Mensch als Fahrer in der ODD. Waymo-Robotaxi in der Geofence."],
          ["SAE L5", "Vollautomatisiert", "Überall. Existiert nicht als Produkt."],
        ]
      : [
          ["SAE L0–L1", "Assistance", "Human drives; the system helps."],
          ["SAE L2", "Partial", "Human remains the driver — Tesla FSD Supervised lives here, however good the drive."],
          ["SAE L3", "Conditional", "System drives in the ODD; a human must be able to take over. The legally interesting German case."],
          ["SAE L4", "High", "No human as driver inside the ODD. Waymo robotaxi inside the geofence."],
          ["SAE L5", "Full", "Everywhere. Not a product."],
        ];

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-border last:border-0">
              <th className="px-5 py-4 align-top font-mono text-xs font-medium whitespace-nowrap text-accent">
                {row[0]}
              </th>
              <td className="px-5 py-4 align-top font-medium text-fg">{row[1]}</td>
              <td className="hidden px-5 py-4 text-muted sm:table-cell">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
