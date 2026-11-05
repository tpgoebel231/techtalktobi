import { BUNDESLAND_PATHS, BUNDESLAND_VIEWBOX, type Bundesland } from "@/data/bonn-bundeslaender";

export const ANMELDUNGEN_BY_BUNDESLAND: Record<Bundesland, number> = {
  "Baden-Württemberg": 0,
  Bayern: 0,
  Berlin: 0,
  Brandenburg: 0,
  Bremen: 0,
  Hamburg: 1,
  Hessen: 1,
  "Mecklenburg-Vorpommern": 0,
  Niedersachsen: 1,
  "Nordrhein-Westfalen": 2,
  "Rheinland-Pfalz": 0,
  Saarland: 0,
  Sachsen: 2,
  "Sachsen-Anhalt": 0,
  "Schleswig-Holstein": 0,
  Thüringen: 0,
};

export const ORIGIN_COLORS = { empty: "#2A2B2F", one: "#DDBB38", multiple: "#9E7B10" } as const;

export function BonnOriginMap() {
  return (
    <section id="herkunft" aria-labelledby="h-herkunft">
      <div className="wrap">
        <p className="label">Bisherige Anmeldungen</p>
        <h2 id="h-herkunft">Wo Ihr Herkommt</h2>
        <figure className="origin-map card">
          <svg
            className="origin-map-svg"
            viewBox={BUNDESLAND_VIEWBOX}
            role="img"
            aria-labelledby="origin-map-title origin-map-description"
          >
            <title id="origin-map-title">Anmeldungen nach Bundesland</title>
            <desc id="origin-map-description">
              {Object.entries(ANMELDUNGEN_BY_BUNDESLAND)
                .map(([name, count]) => `${name}: ${count}`)
                .join(". ")}
            </desc>
            {(Object.entries(BUNDESLAND_PATHS) as [Bundesland, string][]).map(([name, d]) => {
              const count = ANMELDUNGEN_BY_BUNDESLAND[name];
              return (
                <path
                  key={name}
                  d={d}
                  fill={count === 0 ? ORIGIN_COLORS.empty : count === 1 ? ORIGIN_COLORS.one : ORIGIN_COLORS.multiple}
                  fillRule="evenodd"
                  stroke={count === 0 ? "#92949B" : "#1E1F22"}
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{`${name}: ${count}`}</title>
                </path>
              );
            })}
          </svg>
          <figcaption>
            <ul className="origin-legend" aria-label="Legende">
              <li><span style={{ backgroundColor: ORIGIN_COLORS.empty }} />Keine Anmeldung</li>
              <li><span style={{ backgroundColor: ORIGIN_COLORS.one }} />1 Anmeldung</li>
              <li><span style={{ backgroundColor: ORIGIN_COLORS.multiple }} />ab 2 Anmeldungen</li>
            </ul>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
