import type { Locale } from "@/lib/locale";

export const RESEARCH_SLUGS = [
  "self-driving",
  "speed-vs-safety",
  "tesla-ecosystem",
  "ai-robotics",
  "fsd-matrix",
  "waymo",
] as const;

export type ResearchSlug = (typeof RESEARCH_SLUGS)[number];
export type ResearchKind = "essay" | "tool" | "matrix" | "tracker" | "map";

export type LocalizedText = Record<Locale, string>;

export type ResearchPiece = {
  slug: ResearchSlug;
  kind: ResearchKind;
  date: string;
  image: string;
  title: LocalizedText;
  dek: LocalizedText;
  tags: LocalizedText[];
  paragraphs: LocalizedText[];
};

export const research: ResearchPiece[] = [
  {
    slug: "self-driving",
    kind: "essay",
    date: "2026-06",
    image: "/images/research-self-driving.jpg",
    title: {
      en: "Self-Driving Analysis",
      de: "Analyse autonomes Fahren",
    },
    dek: {
      en: "Comparative analysis of autonomous development cycles and SAE standards — and why the slideware levels keep getting used as a marketing language.",
      de: "Vergleichende Analyse der Entwicklungszyklen und SAE-Stufen — und warum Folien-Level weiterhin als Marketingsprache dienen.",
    },
    tags: [
      { en: "SAE J3016", de: "SAE J3016" },
      { en: "L2 vs L4", de: "L2 vs. L4" },
    ],
    paragraphs: [
      {
        en: "SAE J3016 was written as an engineering taxonomy, not a consumer label. Level 2 still means the human is the driver. Level 4 means the system is the driver inside a defined domain. Most public argument is people using those numbers as a score.",
        de: "SAE J3016 ist eine ingenieurtechnische Taxonomie, kein Verbraucherlabel. Level 2 heißt: der Mensch ist der Fahrer. Level 4 heißt: das System ist der Fahrer, in einem definierten Bereich. Die öffentliche Debatte behandelt die Zahlen oft wie eine Rangliste.",
      },
      {
        en: "Two development cycles now run in parallel. The mapping-and-ODD school (Waymo and peers) grows competence by fencing the world: geofence, HD map, stacked redundancy, operational playbooks. The vision-and-fleet school (Tesla and a few others) grows competence by collecting edge cases at consumer scale and training through them. Neither cycle is 'faster' in the abstract — they spend time on different risks.",
        de: "Zwei Entwicklungszyklen laufen parallel. Die Mapping-und-ODD-Schule (Waymo und vergleichbare) wächst, indem sie die Welt einzäunt: Geofence, HD-Karte, Redundanz, Playbooks. Die Vision-und-Flotten-Schule (Tesla und wenige andere) wächst, indem sie Edge Cases in Consumer-Skala einsammelt und durcharbeitet. Kein Zyklus ist abstrakt 'schneller' — sie kaufen unterschiedliche Risiken.",
      },
      {
        en: "A useful question is not 'what level is it?' but 'who is legally the driver, in which domain, with what fallback, and who holds the keys when it fails?' That question maps cleanly onto UNECE automation categories and German StVG obligations — and poorly onto a single SAE integer.",
        de: "Die bessere Frage ist nicht 'welches Level?', sondern: wer ist rechtlich der Fahrer, in welchem Bereich, mit welchem Fallback, und wer hält die Schlüssel im Fehlerfall? Das lässt sich sauber auf UNECE-Kategorien und das StVG abbilden — und schlecht auf eine einzelne SAE-Zahl.",
      },
    ],
  },
  {
    slug: "speed-vs-safety",
    kind: "tool",
    date: "2026-04",
    image: "/images/research-speed-safety.jpg",
    title: {
      en: "Speed vs Safety Tool",
      de: "Tempo vs. Sicherheit",
    },
    dek: {
      en: "Interactive explainer for how speed, reaction time, and road grip affect stopping distance, impact energy, and pedestrian injury risk.",
      de: "Interaktiver Erklärer: Wie Tempo, Reaktionszeit und Griffigkeit Anhalteweg, Aufprallenergie und Verletzungsrisiko für Fußgänger verändern.",
    },
    tags: [
      { en: "Physics", de: "Physik" },
      { en: "VRU", de: "VRU" },
    ],
    paragraphs: [
      {
        en: "Kinetic energy scales with the square of speed. Braking distance does too. That is why a 'slightly faster' urban pass is not a slight change in outcome for a pedestrian. Use the sliders; the geometry is the argument.",
        de: "Kinetische Energie skaliert mit dem Quadrat der Geschwindigkeit. Der Bremsweg ebenfalls. Deshalb ist ein 'bisschen schnelleres' Tempo in der Stadt keine kleine Änderung im Ausgang für Fußgänger. Die Schieber sind das Argument.",
      },
    ],
  },
  {
    slug: "tesla-ecosystem",
    kind: "tracker",
    date: "2026-05",
    image: "/images/research-ecosystem.jpg",
    title: {
      en: "Tesla Ecosystem",
      de: "Tesla-Ökosystem",
    },
    dek: {
      en: "Historical data tracking the financial evolution of Full Self-Driving technology — package price, subscription, and the Robotaxi story sitting on top of it.",
      de: "Historische Daten zur finanziellen Entwicklung von Full Self-Driving — Paketpreis, Abo und die Robotaxi-Erzählung darüber.",
    },
    tags: [
      { en: "FSD pricing", de: "FSD-Preise" },
      { en: "Robotaxi", de: "Robotaxi" },
    ],
    paragraphs: [
      {
        en: "FSD has been sold as a feature, a subscription, an equity story, and a future robotaxi claim. The package price on the window sticker is only one line in that ledger. Compiled below from public announcements; not investment advice.",
        de: "FSD wurde als Feature, als Abo, als Equity-Story und als künftige Robotaxi-Behauptung verkauft. Der Paketpreis auf dem Sticker ist nur eine Zeile in diesem Buch. Unten zusammengestellt aus öffentlichen Angaben; keine Anlageberatung.",
      },
      {
        en: "Read the price path as a demand and positioning experiment, not as a cost-plus. When the unsupervised and robotaxi narratives heat up, the option is framed as an appreciating asset. When take-rate matters more, it is framed as a software attach. Both frames can be true in different quarters.",
        de: "Den Preispfad als Nachfrage- und Positionierungsexperiment lesen, nicht als Cost-plus. Wenn Unsupervised und Robotaxi heißlaufen, wird die Option zum wertsteigernden Asset. Wenn die Take-Rate zählt, wird sie zum Software-Attach. Beide Frames können in unterschiedlichen Quartalen stimmen.",
      },
    ],
  },
  {
    slug: "ai-robotics",
    kind: "map",
    date: "2026-07",
    image: "/images/research-robotics.jpg",
    title: {
      en: "AI & Robotics",
      de: "KI & Robotik",
    },
    dek: {
      en: "Mapping the humanoid robotics landscape and the technological stack — actuation, compute, teleoperation, and the policy problems nobody puts in the keynote.",
      de: "Die Humanoide-Landschaft und der Stack: Aktorik, Compute, Teleoperation — und die Policy-Fragen, die es nicht in die Keynote schaffen.",
    },
    tags: [
      { en: "Humanoids", de: "Humanoide" },
      { en: "Stack", de: "Stack" },
    ],
    paragraphs: [
      {
        en: "A humanoid is a bet that the world is already built for humans, so the robot should be too. The stack underneath that bet is not one product: actuators and gearboxes, battery and thermal, hands, onboard compute, foundation models, teleoperation for data, and a safety case that industrial regulators will actually accept.",
        de: "Ein Humanoid ist die Wette, dass die Welt für Menschen gebaut ist — also auch der Roboter so sein sollte. Der Stack darunter ist kein Produkt: Aktorik, Getriebe, Batterie und Thermik, Hände, Onboard-Compute, Foundation Models, Teleoperation für Daten, und ein Safety Case, den Industrieaufsicht wirklich akzeptiert.",
      },
      {
        en: "The interesting split in 2026 is not 'who has a demo'. It is who is collecting real hours in a real workplace, who still depends on a puppeteer, and who has a path from supervised factory tasks to unsupervised ones without rewriting the safety case every quarter.",
        de: "Die interessante Trennung 2026 ist nicht 'wer hat eine Demo'. Sondern: wer sammelt echte Stunden am echten Arbeitsplatz, wer hängt noch am Puppenspieler, und wer hat einen Weg von überwachten Fabrikaufgaben zu unüberwachten, ohne jedes Quartal den Safety Case neu zu schreiben.",
      },
    ],
  },
  {
    slug: "fsd-matrix",
    kind: "matrix",
    date: "2026-08",
    image: "/images/research-fsd-matrix.jpg",
    title: {
      en: "Tesla FSD Assessment Matrix",
      de: "Tesla-FSD-Bewertungsmatrix",
    },
    dek: {
      en: "Public assessment matrix of the state of FSD — a subjective take by the author, from daily supervised driving in the US.",
      de: "Öffentliche Bewertungsmatrix zum Stand von FSD — subjektive Einordnung des Autors, aus dem beaufsichtigten Alltag in den USA.",
    },
    tags: [
      { en: "FSD Supervised", de: "FSD Supervised" },
      { en: "Author's take", de: "Einschätzung" },
    ],
    paragraphs: [
      {
        en: "This is not Tesla's scorecard and not a regulator's. It is mine, updated from daily supervised driving around Boston and on US highways. Scores are 1–5. Five does not mean unsupervised; it means 'I rarely intervene in this class of scene'. One means 'I treat it as a demo, not a driver'.",
        de: "Das ist nicht Teslas Scorecard und nicht die eines Regulators. Es ist meine, fortgeschrieben aus beaufsichtigtem Alltag um Boston und auf US-Highways. Skala 1–5. Fünf heißt nicht Unsupervised; es heißt 'in dieser Szenenklasse greife ich selten ein'. Eins heißt 'Demo, kein Fahrer'.",
      },
    ],
  },
  {
    slug: "waymo",
    kind: "tracker",
    date: "2026-08",
    image: "/images/research-waymo.jpg",
    title: {
      en: "Waymo Rollout",
      de: "Waymo-Rollout",
    },
    dek: {
      en: "Tracking Waymo's autonomous vehicle deployment and market expansion — cities, service mode, and what 'driverless' actually covers.",
      de: "Waymos Ausrollen und Marktexpansion — Städte, Betriebsmodus, und was 'fahrerlos' tatsächlich abdeckt.",
    },
    tags: [
      { en: "Robotaxi", de: "Robotaxi" },
      { en: "ODD", de: "ODD" },
    ],
    paragraphs: [
      {
        en: "Waymo is the existence proof that a geofenced, heavily mapped, multi-sensor L4 service can carry passengers without a person in the seat. The question for 2026 is not 'does it work in Phoenix'. It is how expensive each new city is, how weather and density punish the ODD, and how fast the playbook copies.",
        de: "Waymo ist der Existenzbeweis, dass ein geofencter, stark kartierter, multisensorischer L4-Dienst Fahrgäste ohne Person auf dem Sitz tragen kann. Die Frage 2026 ist nicht 'geht Phoenix'. Sondern: wie teuer jede neue Stadt ist, wie Wetter und Dichte die ODD bestrafen, und wie schnell das Playbook kopiert.",
      },
    ],
  },
];

export function getResearch(slug: string): ResearchPiece | undefined {
  return research.find((item) => item.slug === slug);
}

export function isResearchSlug(value: string): value is ResearchSlug {
  return RESEARCH_SLUGS.includes(value as ResearchSlug);
}

export const fsdPriceHistory = [
  { date: "2016", price: 3000 },
  { date: "2017", price: 5000 },
  { date: "2018", price: 8000 },
  { date: "2019", price: 7000 },
  { date: "2020", price: 8000 },
  { date: "2021", price: 10000 },
  { date: "2022", price: 12000 },
  { date: "2022*", price: 15000 },
  { date: "2024", price: 12000 },
  { date: "2025", price: 8000 },
  { date: "2026", price: 8000 },
];

export type MatrixRow = {
  id: string;
  label: LocalizedText;
  score: number;
  note: LocalizedText;
};

export const fsdMatrix: MatrixRow[] = [
  {
    id: "highway",
    label: { en: "Highway cruising", de: "Autobahn / Highway" },
    score: 5,
    note: {
      en: "The most mature class. Still requires supervision at merges, emergency vehicles, and sudden slowdowns.",
      de: "Die reifste Klasse. Aufsicht bleibt Pflicht bei Einfädeln, Einsatzfahrzeugen und plötzlichem Verzögern.",
    },
  },
  {
    id: "urban",
    label: { en: "Urban streets", de: "Stadtstraßen" },
    score: 4,
    note: {
      en: "Boston suburbs and tight neighborhoods are largely usable. Construction and dual-parked streets still draw interventions.",
      de: "Bostoner Vororte und enge Viertel sind weitgehend nutzbar. Baustellen und doppeltes Parken fordern weiter Eingriffe.",
    },
  },
  {
    id: "unprotected",
    label: { en: "Unprotected turns", de: "Ungeschützte Abbieger" },
    score: 3,
    note: {
      en: "Better than two years ago, still the scene class I watch with a foot hovering.",
      de: "Besser als vor zwei Jahren, weiterhin die Szenenklasse mit schwebendem Fuß.",
    },
  },
  {
    id: "vru",
    label: { en: "Pedestrians & cyclists", de: "Fußgänger & Radfahrer" },
    score: 4,
    note: {
      en: "Generally cautious. Rare over-creep at crosswalks is the failure mode I still document.",
      de: "Grundsätzlich vorsichtig. Gelegentliches Nachrollen am Zebrastreifen dokumentiere ich weiter.",
    },
  },
  {
    id: "night",
    label: { en: "Night", de: "Nacht" },
    score: 4,
    note: {
      en: "Vision stack holds up. Poorly lit rural edges and glare remain the watch items.",
      de: "Vision-Stack hält. Schlecht ausgeleuchtete Ortsränder und Blendung bleiben Beobachtungspunkte.",
    },
  },
  {
    id: "precip",
    label: { en: "Rain & fog", de: "Regen & Nebel" },
    score: 3,
    note: {
      en: "Wet Boston winters are a real test. Heavy spray and fog still degrade confidence.",
      de: "Nasse Boston-Winter sind ein echter Test. Gischt und Nebel senken die Zuversicht.",
    },
  },
  {
    id: "works",
    label: { en: "Construction", de: "Baustellen" },
    score: 3,
    note: {
      en: "Temporary lanes and human traffic controllers are still a common reason to take over.",
      de: "Behelfsfahrstreifen und Einweiser sind weiterhin ein häufiger Übernahmegrund.",
    },
  },
  {
    id: "emergency",
    label: { en: "Emergency vehicles", de: "Einsatzfahrzeuge" },
    score: 3,
    note: {
      en: "Improved recognition, inconsistent yield choreography. I still take these.",
      de: "Bessere Erkennung, uneinheitliches Verhalten beim Bilden einer Rettungsgasse. Die nehme ich weiter selbst.",
    },
  },
  {
    id: "parking",
    label: { en: "Parking & summon", de: "Parken & Summon" },
    score: 3,
    note: {
      en: "Useful in marked lots. Tight urban curb hunts are not a replacement for the driver.",
      de: "Nützlich auf markierten Parkplätzen. Enge städtische Lücken ersetzen den Fahrer nicht.",
    },
  },
  {
    id: "unsup",
    label: { en: "Unsupervised-ready", de: "Unsupervised-tauglich" },
    score: 2,
    note: {
      en: "Not my call to make as a product claim. As a daily supervisor: not yet, not here, not in this weather mix.",
      de: "Keine Produktbehauptung von mir. Als täglicher Supervisor: noch nicht, nicht hier, nicht in diesem Wetter-Mix.",
    },
  },
];

export type RobotFirm = {
  name: string;
  hq: LocalizedText;
  stack: LocalizedText;
  status: LocalizedText;
};

export const robotFirms: RobotFirm[] = [
  {
    name: "Tesla Optimus",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Vision, end-to-end learning, in-house actuators",
      de: "Vision, End-to-End, eigene Aktorik",
    },
    status: {
      en: "Factory tasks in limited form; public demos ahead of unsupervised hours",
      de: "Begrenzte Fabrikaufgaben; öffentliche Demos vor unüberwachten Stunden",
    },
  },
  {
    name: "Figure",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Humanoid + BMW-class manufacturing pilots, foundation-model bets",
      de: "Humanoid + Fertigungspiloten auf BMW-Niveau, Foundation-Model-Wette",
    },
    status: {
      en: "High-visibility pilots; teleop still in the data loop",
      de: "Sichtbare Piloten; Teleop weiter in der Datenschleife",
    },
  },
  {
    name: "Boston Dynamics Atlas",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Electric Atlas, world-class mobility, Hyundai industrial path",
      de: "Elektrisches Atlas, Mobility auf Weltniveau, industrieller Hyundai-Pfad",
    },
    status: {
      en: "Research and industrial transition",
      de: "Forschung und industrieller Übergang",
    },
  },
  {
    name: "Agility Digit",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Biped for logistics, GXO-style warehouse work",
      de: "Biped für Logistik, Lagerarbeit im GXO-Stil",
    },
    status: {
      en: "Early commercial hours; form factor is the thesis",
      de: "Frühe kommerzielle Stunden; Formfaktor ist die These",
    },
  },
  {
    name: "1X Neo",
    hq: { en: "Norway / USA", de: "Norwegen / USA" },
    stack: {
      en: "Soft-robotics bias, home thesis, tendon-driven hardware",
      de: "Soft-Robotics-Hang, These Wohnen, sehnengetriebene Hardware",
    },
    status: {
      en: "Consumer narrative, safety case still the gate",
      de: "Consumer-Narrativ, Safety Case bleibt das Tor",
    },
  },
  {
    name: "Apptronik Apollo",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Industrial humanoid, Mercedes and Google-class partners",
      de: "Industrie-Humanoid, Partner auf Mercedes- und Google-Niveau",
    },
    status: {
      en: "Partner-led factory path",
      de: "Partnergetriebener Fabrikpfad",
    },
  },
  {
    name: "Unitree",
    hq: { en: "China", de: "China" },
    stack: {
      en: "Cost, volume, quadruped heritage into humanoids",
      de: "Kosten, Stückzahl, Quadruped-Erbe in Humanoiden",
    },
    status: {
      en: "Hardware accessible; stack catching up in public",
      de: "Hardware zugänglich; Stack holt öffentlich auf",
    },
  },
  {
    name: "NEURA Robotics",
    hq: { en: "Germany", de: "Deutschland" },
    stack: {
      en: "Cognitive robotics, European industrial customers",
      de: "Kognitive Robotik, europäische Industriekunden",
    },
    status: {
      en: "EU-native alternative in the conversation",
      de: "EU-native Alternative im Gespräch",
    },
  },
];

export type WaymoCity = {
  city: LocalizedText;
  since: string;
  mode: LocalizedText;
  note: LocalizedText;
};

export const waymoCities: WaymoCity[] = [
  {
    city: { en: "Phoenix", de: "Phoenix" },
    since: "2020",
    mode: { en: "Public robotaxi", de: "Öffentliches Robotaxi" },
    note: {
      en: "The original commercial ODD. Still the reference city for weather-easy, mapped L4.",
      de: "Die ursprüngliche kommerzielle ODD. Referenzstadt für wetterleichtes, kartiertes L4.",
    },
  },
  {
    city: { en: "San Francisco", de: "San Francisco" },
    since: "2024",
    mode: { en: "Public robotaxi", de: "Öffentliches Robotaxi" },
    note: {
      en: "Density, hills, and politics. The city that taught everyone else about edge cases and city hall.",
      de: "Dichte, Hügel, Politik. Die Stadt, die alle anderen Edge Cases und City Hall gelehrt hat.",
    },
  },
  {
    city: { en: "Los Angeles", de: "Los Angeles" },
    since: "2024",
    mode: { en: "Public robotaxi", de: "Öffentliches Robotaxi" },
    note: {
      en: "Scale play. Freeways plus sprawl — a different ODD than the grid of SF.",
      de: "Skalenspiel. Freeways plus Fläche — eine andere ODD als das Raster von SF.",
    },
  },
  {
    city: { en: "Austin", de: "Austin" },
    since: "2025",
    mode: { en: "Service expanding", de: "Service im Ausbau" },
    note: {
      en: "Overlaps the Tesla robotaxi conversation geographically. Useful for side-by-side watching.",
      de: "Geographische Überlappung mit der Tesla-Robotaxi-Debatte. Nützlich für den Direktvergleich.",
    },
  },
  {
    city: { en: "Atlanta", de: "Atlanta" },
    since: "2025",
    mode: { en: "Service expanding", de: "Service im Ausbau" },
    note: {
      en: "Airport and highway mix. A test of whether the playbook survives humidity and Southern sprawl.",
      de: "Airport- und Highway-Mix. Test, ob das Playbook Luftfeuchtigkeit und Southern Sprawl übersteht.",
    },
  },
  {
    city: { en: "Further metros", de: "Weitere Metropolen" },
    since: "2026",
    mode: { en: "Announced / staged", de: "Angekündigt / vorbereitet" },
    note: {
      en: "The 2026 question is cadence: how many new ODDs per year before the map-and-ops cost dominates.",
      de: "Die Frage 2026 ist der Takt: wie viele neue ODDs pro Jahr, bevor Map- und Ops-Kosten dominieren.",
    },
  },
];
