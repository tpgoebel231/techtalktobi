import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Port of muskonomy/synergies.html (techtalktobi-old, last edited Aug 25 2026).
 * All data is static and inline, exactly as in the original page.
 * German strings: Colleen's localization (Oct 21 2026).
 * Round 2 (Oct 21 2026): Kimbal review edits + Tobias decisions, copy by Colleen.
 * Rule: above the line = sold or provided between the companies;
 * below the line = enabling tech, not sold to each other.
 */

type L = { en: string; de: string };
const same = (v: string): L => ({ en: v, de: v });

type Category = {
  id: string;
  title: L;
  color: string;
  products: { label: L; row?: string }[];
  enabling: L[];
};

const CATEGORIES: Category[] = [
  {
    id: "connectivity",
    title: { en: "Orbital Compute and Connectivity", de: "Rechenzentren und Vernetzung im Orbit" },
    color: "#17b7ff",
    products: [
      { label: same("Starmind"), row: "starmind" },
      { label: same("Starlink"), row: "starlink" },
      { label: same("Starshield"), row: "starshield" },
    ],
    enabling: ["Raptor", "Dragon", "Starbase", "Starship", "Falcon 9", "Falcon Heavy"].map(same),
  },
  {
    id: "ai",
    title: { en: "Intelligence", de: "Intelligenz" },
    color: "#ff5f9a",
    products: [
      { label: same("Grok"), row: "grok" },
      { label: same("Colossus 2"), row: "colossus-2" },
      { label: same("X"), row: "x" },
      { label: same("FSD"), row: "fsd" },
      { label: same("AI5/AI6"), row: "ai5-ai6" },
      { label: { en: "FSD fleet data", de: "FSD-Flottendaten" }, row: "fsd-fleet-data" },
    ],
    enabling: ["Cortex", "Terafab", "Dojo3"].map(same),
  },
  {
    id: "energy",
    title: { en: "Hardware & Energy", de: "Hardware & Energie" },
    color: "#ffb020",
    products: [
      { label: same("Optimus"), row: "optimus" },
      { label: same("Cybertruck"), row: "cybertruck" },
      { label: same("Cybercab"), row: "cybercab" },
      { label: same("Megapack"), row: "megapack" },
    ],
    enabling: [
      ...["Model 3", "Model Y", "Powerwall"].map(same),
      { en: "4680 cell", de: "4680-Zelle" },
      same("Gigafactory"),
    ],
  },
];

type Section = { label: L; y: number; color: string };
const SECTIONS: Section[] = [
  { label: CATEGORIES[0].title, y: 78, color: "#17b7ff" },
  { label: CATEGORIES[1].title, y: 232, color: "#ff5f9a" },
  { label: CATEGORIES[2].title, y: 508, color: "#ffb020" },
];

type Row = {
  id: string;
  label: L;
  note: L;
  y: number;
  /** "toTesla": SpaceX / xAI to Tesla. "toSpacex": Tesla to SpaceX / xAI. */
  dir: "toTesla" | "toSpacex";
  stroke: string;
};

const BLUE = { stroke: "#17b7ff" };
const PINK = { stroke: "#ff5f9a" };
const AMBER = { stroke: "#ffb020" };

const ROWS: Row[] = [
  { id: "starmind", label: same("Starmind"), note: { en: "for Optimus and FSD training", de: "fürs Training von Optimus und FSD" }, y: 120, dir: "toTesla", ...BLUE },
  { id: "starlink", label: same("Starlink*"), note: { en: "for robotaxi remote monitoring", de: "für Robotaxi-Fernüberwachung" }, y: 160, dir: "toTesla", ...BLUE },
  { id: "starshield", label: same("Starshield"), note: { en: "for secure robotaxi fleet comms", de: "für sichere Robotaxi-Kommunikation" }, y: 200, dir: "toTesla", ...BLUE },
  { id: "grok", label: same("Grok*"), note: { en: "for in-car AI and Optimus voice", de: "als KI im Auto und Stimme von Optimus" }, y: 274, dir: "toTesla", ...PINK },
  { id: "colossus-2", label: same("Colossus 2"), note: { en: "for Optimus training", de: "fürs Optimus-Training" }, y: 314, dir: "toTesla", ...PINK },
  { id: "x", label: same("X*"), note: { en: "for advertising", de: "für Werbung" }, y: 354, dir: "toTesla", ...PINK },
  { id: "fsd-fleet-data", label: { en: "FSD fleet data", de: "FSD-Flottendaten" }, note: { en: "for world-model training", de: "fürs Training von Weltmodellen" }, y: 394, dir: "toSpacex", ...PINK },
  { id: "ai5-ai6", label: same("AI5/AI6"), note: { en: "for Starmind", de: "für Starmind" }, y: 434, dir: "toSpacex", ...PINK },
  { id: "fsd", label: same("FSD"), note: { en: "for Moon base", de: "für die Mondbasis" }, y: 474, dir: "toSpacex", ...PINK },
  { id: "optimus", label: same("Optimus"), note: { en: "for Moon base", de: "für die Mondbasis" }, y: 550, dir: "toSpacex", ...AMBER },
  { id: "cybertruck", label: same("Cybertruck*"), note: { en: "for Starbase fleet and Moon base", de: "für die Flotte in Starbase und die Mondbasis" }, y: 590, dir: "toSpacex", ...AMBER },
  { id: "cybercab", label: same("Cybercab"), note: { en: "for Starbase and Moon base transport", de: "für Transporte in Starbase und auf dem Mond" }, y: 630, dir: "toSpacex", ...AMBER },
  { id: "megapack", label: same("Megapack*"), note: { en: "for Earth and Moon facilities", de: "für Anlagen auf Erde und Mond" }, y: 670, dir: "toSpacex", ...AMBER },
];

const TEXT = {
  eyebrow: { en: "Strategic dependency map", de: "Strategische Abhängigkeiten" },
  heading: { en: "SpaceX, xAI and Tesla", de: "SpaceX, xAI und Tesla" },
  intro: {
    en: "This map organizes the relationships between SpaceX, xAI and Tesla into orbital compute and connectivity, intelligence, and hardware and energy. The diagram highlights the practical exchange of models, data, connectivity, chips, robots, vehicles, and large-scale infrastructure across the network.",
    de: "Diese Karte ordnet die Verflechtungen zwischen SpaceX, xAI und Tesla drei Bereichen zu: Rechenzentren und Vernetzung im Orbit, Intelligenz sowie Hardware und Energie. Das Diagramm zeigt, was zwischen den Firmen konkret hin und her geht: Modelle, Daten, Konnektivität, Chips, Roboter, Fahrzeuge und Infrastruktur im großen Stil.",
  },
  howToRead: {
    en: "How to read this map: in each card, everything above the line is a product or service one side sells or provides to the other, now or down the road. The arrows show which way it flows, and * means it's already a paying relationship today. Everything below the line is enabling tech; it makes those products possible but isn't sold between the companies, like Model 3 and Model Y.",
    de: "So liest man die Karte: In jeder Karte steht oberhalb der Linie, was eine Seite der anderen verkauft oder liefert, heute oder in Zukunft. Die Pfeile zeigen, in welche Richtung das geht, und * heißt: Da fließt heute schon Geld. Unterhalb der Linie steht die technische Basis; sie macht diese Produkte erst möglich, wird zwischen den Firmen aber nicht gehandelt, zum Beispiel Model 3 und Model Y.",
  },
  grouped: { en: "Products grouped by category", de: "Produkte nach Bereich" },
  supplied: { en: "Supplied to each other", de: "Liefern sich gegenseitig" },
  lineNote: {
    en: "Above: sold or provided to each other. Below: enabling tech, not sold between them.",
    de: "Oben: wird untereinander verkauft oder geliefert. Unten: technische Basis, wird nicht gehandelt.",
  },
  enabling: { en: "Enabling tech (not traded)", de: "Technische Basis (nicht gehandelt)" },
  diagram: { en: "Mutual dependencies between SpaceX, xAI and Tesla", de: "Wer von wem abhängt: SpaceX, xAI und Tesla" },
  svgTitle: {
    en: "Three-category dependency diagram between SpaceX, xAI, and Tesla",
    de: "Abhängigkeitsdiagramm zwischen SpaceX, xAI und Tesla in drei Bereichen",
  },
  svgDesc: {
    en: "Diagram showing orbital compute and connectivity, intelligence, and hardware and energy dependencies between SpaceX/xAI and Tesla, with arrows indicating the direction of dependency.",
    de: "Das Diagramm zeigt die Abhängigkeiten zwischen SpaceX/xAI und Tesla in den Bereichen Rechenzentren und Vernetzung im Orbit, Intelligenz sowie Hardware und Energie. Die Pfeile zeigen, wer wen braucht.",
  },
  footnote: { en: "* already a commercial relationship today", de: "* schon heute eine bestehende Geschäftsbeziehung" },
  footnote2: {
    en: "Tesla's $2B xAI investment converted to SpaceX stock (under 1%) in March 2026.",
    de: "Teslas Beteiligung an xAI über 2 Milliarden Dollar wurde im März 2026 in SpaceX-Aktien umgewandelt (unter 1 %).",
  },
} satisfies Record<string, L>;

type Box = { x: number; y: number; width: number; height: number };

export function MuskonomyMap() {
  const locale = useLocale();
  const [greyed, setGreyed] = useState<Set<string>>(() => new Set());
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const labelRefs = useRef<Record<string, SVGTextElement | null>>({});

  // Draw a pill behind each diagram row label, sized to the rendered text.
  useLayoutEffect(() => {
    const measure = () => {
      const next: Record<string, Box> = {};
      for (const row of ROWS) {
        const el = labelRefs.current[row.id];
        if (!el) continue;
        const b = el.getBBox();
        next[row.id] = { x: b.x, y: b.y, width: b.width, height: b.height };
      }
      setBoxes(next);
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }, [locale]);

  const toggle = (key: string) =>
    setGreyed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const onKey = (key: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(key);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section
        id="overview"
        className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-8"
      >
        <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
          {TEXT.eyebrow[locale]}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-fg sm:text-4xl">
          {TEXT.heading[locale]}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
          {TEXT.intro[locale]}
        </p>
        <p className="mt-4 max-w-3xl rounded-lg bg-surface-2 px-4 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)]">
          {TEXT.howToRead[locale]}
        </p>

        <p className="mt-8 mb-3 font-mono text-[11px] tracking-widest text-faint uppercase">
          {TEXT.grouped[locale]}
        </p>
        <div
          className="grid gap-3 md:grid-cols-3"
          aria-label={TEXT.grouped[locale]}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="relative overflow-hidden rounded-lg bg-surface-2 p-4 pl-5 shadow-[var(--shadow-border)]"
              style={{ boxShadow: `inset 3px 0 0 ${cat.color}, var(--shadow-border)` }}
            >
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-fg">
                <span
                  aria-hidden="true"
                  className="size-2 flex-none rounded-full"
                  style={{ background: cat.color, boxShadow: `0 0 0 4px ${cat.color}38` }}
                />
                {cat.title[locale]}
              </h3>
              <p className="mb-2 font-mono text-[10px] tracking-widest text-muted uppercase">
                {TEXT.supplied[locale]}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {cat.products.map((p) => {
                  const key = p.row!;
                  const off = greyed.has(key);
                  return (
                    <li
                      key={p.label.en}
                      role="button"
                      tabIndex={0}
                      aria-pressed={off}
                      onClick={() => toggle(key)}
                      onKeyDown={onKey(key)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[13px] leading-tight whitespace-nowrap text-fg transition-[opacity,filter] select-none",
                        off && "opacity-30 grayscale",
                      )}
                      style={{ background: `${cat.color}24`, borderColor: `${cat.color}61` }}
                    >
                      {p.label[locale]}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4" role="separator" aria-hidden="true">
                <div className="h-0.5 rounded-full" style={{ background: `${cat.color}b3` }} />
              </div>
              <p className="mt-2 text-xs leading-snug text-muted italic">{TEXT.lineNote[locale]}</p>
              <p className="mt-3 mb-2 font-mono text-[10px] tracking-widest text-faint uppercase">
                {TEXT.enabling[locale]}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {cat.enabling.map((label) => (
                  <li
                    key={label.en}
                    className="rounded-full border border-dashed px-2.5 py-1 text-[13px] leading-tight whitespace-nowrap text-muted"
                    style={{ borderColor: `${cat.color}6b` }}
                  >
                    {label[locale]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        id="diagram"
        className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-8"
      >
        <h2 className="font-display text-2xl leading-tight text-fg sm:text-3xl">
          {TEXT.diagram[locale]}
        </h2>
        <div className="mt-6 overflow-x-auto rounded-lg bg-bg/60">
          <svg
            className="block h-auto w-full min-w-[640px] font-sans"
            viewBox="0 0 680 740"
            role="img"
            aria-labelledby="mm-diagram-title mm-diagram-desc"
          >
            <title id="mm-diagram-title">{TEXT.svgTitle[locale]}</title>
            <desc id="mm-diagram-desc">{TEXT.svgDesc[locale]}</desc>
            <defs>
              <marker
                id="mm-ar"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M2 1L8 5L2 9"
                  fill="none"
                  stroke="context-stroke"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            </defs>

            <HeaderBox x={60}>
              <SpacexLogo />
              <span>/</span>
              <XaiLogo />
            </HeaderBox>
            <HeaderBox x={400}>
              <TeslaLogo />
            </HeaderBox>

            <line x1="170" y1="60" x2="170" y2="700" stroke="#888780" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="510" y1="60" x2="510" y2="700" stroke="#888780" strokeWidth="1" strokeDasharray="4 4" />

            {SECTIONS.map((s) => (
              <g key={s.label.en}>
                <rect x="150" y={s.y} width="380" height="18" rx="9" fill={s.color} opacity="0.18" />
                <text
                  x="340"
                  y={s.y + 9}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ece9df"
                  fontSize="10"
                  fontWeight="600"
                >
                  {s.label[locale]}
                </text>
              </g>
            ))}

            {ROWS.map((row) => {
              const off = greyed.has(row.id);
              const toTesla = row.dir === "toTesla";
              const box = boxes[row.id];
              return (
                <g
                  key={row.id}
                  data-row={row.id}
                  className="transition-[opacity,filter]"
                  style={off ? { opacity: 0.3, filter: "grayscale(1)" } : undefined}
                >
                  <line
                    x1={toTesla ? 174 : 506}
                    y1={row.y}
                    x2={toTesla ? 506 : 174}
                    y2={row.y}
                    stroke={row.stroke}
                    strokeWidth="1.6"
                    markerEnd="url(#mm-ar)"
                    fill="none"
                  />
                  <text
                    x="340"
                    y={row.y - 7}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ece9df"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {row.note[locale]}
                  </text>
                  {box ? (
                    <rect
                      x={box.x - 9}
                      y={box.y - 4}
                      width={box.width + 18}
                      height={box.height + 8}
                      rx={(box.height + 8) / 2}
                      fill={row.stroke}
                      fillOpacity="0.14"
                      stroke={row.stroke}
                      strokeOpacity="0.55"
                      strokeWidth="1"
                      pointerEvents="none"
                    />
                  ) : null}
                  <text
                    ref={(el) => {
                      labelRefs.current[row.id] = el;
                    }}
                    x={toTesla ? 162 : 518}
                    y={row.y}
                    textAnchor={toTesla ? "end" : "start"}
                    dominantBaseline="central"
                    fill="#f7f7f3"
                    fontSize="11"
                    fontWeight="700"
                    tabIndex={0}
                    role="button"
                    aria-pressed={off}
                    className="cursor-pointer select-none"
                    onClick={() => toggle(row.id)}
                    onKeyDown={onKey(row.id)}
                  >
                    {row.label[locale]}
                  </text>
                </g>
              );
            })}

            <line x1="150" y1="700" x2="190" y2="700" stroke="#888780" strokeWidth="1" />
            <line x1="490" y1="700" x2="530" y2="700" stroke="#888780" strokeWidth="1" />
          </svg>
        </div>
        <p className="mt-4 text-sm text-muted italic">{TEXT.footnote[locale]}</p>
        <p className="mt-1 text-sm text-muted italic">{TEXT.footnote2[locale]}</p>
      </section>
    </div>
  );
}

function HeaderBox({ x, children }: { x: number; children: React.ReactNode }) {
  return (
    <g>
      <rect x={x} y="20" width="220" height="40" rx="8" fill="#050505" stroke="#ffffff" strokeWidth="1.2" />
      <foreignObject x={x + 4} y="23" width="212" height="34">
        <div className="flex size-full items-center justify-center gap-2.5 text-[13px] font-bold tracking-wide text-white">
          {children}
        </div>
      </foreignObject>
    </g>
  );
}

function SpacexLogo() {
  return (
    <svg className="block h-[18px] w-[92px]" viewBox="0 0 400 50" fill="#ffffff" aria-label="SpaceX logo" role="img">
      <path d="M37.5 30.5H10.9v-6.6h34.3c-.9-2.8-3.8-5.4-8.9-5.4H11.4c-5.7 0-9 2.1-9 6.7v4.9c0 4 3.4 6.3 8.4 6.3h26.9v7H1.5c.9 3.8 3.8 5.8 9 5.8h27.1c5.7 0 8.5-2.2 8.5-6.9v-4.9c0-4.3-3.3-6.6-8.6-6.9z" />
      <path d="M91.8 18.6H59v30.7h9.3V37.5h24.2c6.7 0 10.4-2.3 10.4-7.7v-3.4c-.1-5-4.3-7.8-11.1-7.8zm3 9.8c0 2.2-.4 3.4-4 3.4H68.3l.1-8h22c4 0 4.5 1.2 4.5 3.3v1.3z" />
      <polygon points="129.9,17.3 124.3,24.2 133.8,37.3 114,37.3 109.1,42.5 137.7,42.5 142.6,49.3 153.6,49.3" />
      <path d="M171.4 23.9h34.8c-.9-3.6-4.4-5.4-9.4-5.4h-26c-4.5 0-8.8 1.8-8.8 6.7v17.2c0 4.9 4.3 6.7 8.8 6.7h26.3c6 0 8.1-1.7 9.1-5.8h-34.8V23.9z" />
      <polygon points="228.3,43.5 228.3,34.1 247,34.1 247,28.9 218.9,28.9 218.9,49.3 260.4,49.3 260.4,43.5" />
      <rect width="41.9" height="5.4" x="219.9" y="18.6" />
      <path d="M287.6 18.6H273l17.2 12.6c2.5-1.7 5.4-3.5 8-5l-10.6-7.6zm21.2 15.7c-2.5 1.7-5 3.6-7.4 5.4l13 9.5h14.7l-20.3-14.9z" />
      <path d="M399 .7c-80 4.6-117 38.8-125.3 46.9l-1.7 1.6h14.8C326.8 9.1 384.3 2 399 .7z" />
    </svg>
  );
}


function XaiLogo() {
  return (
    <svg className="block size-5" viewBox="0 0 841.89 595.28" aria-label="xAI logo" role="img">
      <polygon fill="#ffffff" points="557.09,211.99 565.4,538.36 631.96,538.36 640.28,93.18" />
      <polygon fill="#ffffff" points="640.28,56.91 538.72,56.91 379.35,284.53 430.13,357.05" />
      <polygon fill="#ffffff" points="201.61,538.36 303.17,538.36 353.96,465.84 303.17,393.31" />
      <polygon fill="#ffffff" points="201.61,211.99 430.13,538.36 531.69,538.36 303.17,211.99" />
    </svg>
  );
}

function TeslaLogo() {
  return (
    <svg className="block h-[22px] w-[62px]" viewBox="0 0 253.58401 252.502" fill="#ffffff" aria-label="Tesla logo" role="img">
      <g transform="translate(-46.34,-64.797)">
        <path d="M 173.146,317.299 208.622,117.78 c 33.815,0 44.481,3.708 46.021,18.843 0,0 22.684,-8.458 34.125,-25.636 C 244.122,90.299 199.263,89.366 199.263,89.366 l -26.176,31.882 0.059,-0.004 -26.176,-31.883 c 0,0 -44.86,0.934 -89.5,21.622 11.431,17.178 34.124,25.636 34.124,25.636 1.549,-15.136 12.202,-18.844 45.79,-18.868 l 35.762,199.548" />
        <path d="m 173.132,80.157 c 36.09,-0.276 77.399,5.583 119.687,24.014 5.652,-10.173 7.105,-14.669 7.105,-14.669 C 253.697,71.213 210.406,64.954 173.127,64.797 135.85,64.954 92.561,71.214 46.34,89.502 c 0,0 2.062,5.538 7.1,14.669 42.28,-18.431 83.596,-24.29 119.687,-24.014 h 0.005" />
      </g>
    </svg>
  );
}
