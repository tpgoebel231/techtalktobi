import type { Locale } from "@/lib/locale";

export const RESEARCH_SLUGS = [
  "self-driving",
  "speed-vs-safety",
  "tesla-ecosystem",
  "ai-robotics",
  "fsd-matrix",
  "waymo",
  "muskonomy",
  "tesla-gruenheide",
  "mercedes-mb-drive-assist-pro",
  "tuev-adac-ev-tests",
  "vw-automatisiertes-fahren",
] as const;

export type ResearchSlug = (typeof RESEARCH_SLUGS)[number];
export type ResearchKind = "essay" | "tool" | "matrix" | "tracker" | "map";

export type LocalizedText = Record<Locale, string>;

/** Top-level Research categories (index tiles + /{locale}/research/topics/<slug>). */
export const RESEARCH_CATEGORY_SLUGS = [
  "autonomous-driving",
  "robotics",
  "muskonomy",
] as const;

export type ResearchCategorySlug = (typeof RESEARCH_CATEGORY_SLUGS)[number];

export type ResearchCategory = {
  slug: ResearchCategorySlug;
  label: LocalizedText;
  /** Piece whose card image represents the category tile. */
  imageFrom: ResearchSlug;
};

export const RESEARCH_CATEGORIES: ResearchCategory[] = [
  {
    slug: "autonomous-driving",
    label: { en: "Autonomous Driving", de: "Autonomes Fahren" },
    imageFrom: "waymo",
  },
  {
    slug: "robotics",
    label: { en: "Robotics", de: "Robotik" },
    imageFrom: "ai-robotics",
  },
  {
    slug: "muskonomy",
    label: { en: "Muskonomy", de: "Muskonomy" },
    imageFrom: "muskonomy",
  },
];

export type ResearchPiece = {
  slug: ResearchSlug;
  kind: ResearchKind;
  /** Top-level category on the Research index. */
  category: ResearchCategorySlug;
  date: string;
  /** Exact publish day (YYYY-MM-DD) when known; Article JSON-LD falls back to `date`. */
  published?: string;
  image: string;
  title: LocalizedText;
  dek: LocalizedText;
  tags: LocalizedText[];
  paragraphs: LocalizedText[];
  /** Skip the full-width image band on the detail page (image is card-only). */
  noBanner?: boolean;
  /** Shorter title/dek for index and related cards. Detail page and SEO keep title/dek. */
  cardTitle?: LocalizedText;
  cardDek?: LocalizedText;
  /** Companion YouTube video, when there is one. */
  videoId?: string;
  /** Locales this piece is published in. Default: both en and de. */
  locales?: readonly Locale[];
};

export const research: ResearchPiece[] = [
  {
    slug: "self-driving",
    kind: "essay",
    category: "autonomous-driving",
    date: "2026-06",
    image: "/images/research-self-driving.jpg",
    title: {
      en: "Self-Driving Analysis",
      de: "Analyse: Autonomes Fahren",
    },
    dek: {
      en: "Comparative analysis of autonomous development cycles and SAE standards, and why the slideware levels keep getting used as a marketing language.",
      de: "Vergleichende Analyse der Entwicklungszyklen und SAE-Stufen, und warum Folienstufen weiterhin als Marketingsprache dienen.",
    },
    tags: [
      { en: "SAE J3016", de: "SAE J3016" },
      { en: "L2 vs L4", de: "L2 vs. L4" },
    ],
    paragraphs: [
      {
        en: "SAE J3016 was written as an engineering taxonomy, not a consumer label. Level 2 still means the human is the driver. Level 4 means the system is the driver inside a defined domain. Most public argument is people using those numbers as a score.",
        de: "SAE J3016 ist eine technische Taxonomie, kein Etikett für Endkunden. Level 2 heißt: der Mensch ist der Fahrer. Level 4 heißt: das System ist der Fahrer, in einem festgelegten Bereich. Die öffentliche Debatte behandelt die Zahlen oft wie eine Rangliste.",
      },
      {
        en: "Two development cycles now run in parallel. The mapping-and-ODD school (Waymo and peers) grows competence by fencing the world: geofence, HD map, stacked redundancy, operational playbooks. The vision-and-fleet school (Tesla and a few others) grows competence by collecting edge cases at consumer scale and training through them. Neither cycle is 'faster' in the abstract; they spend time on different risks.",
        de: "Zwei Entwicklungszyklen laufen parallel. Die Mapping-Schule (Waymo und vergleichbare) wächst, indem sie die Welt eingrenzt: Geofence, HD-Karte, Redundanz, Einsatzregeln. Die Vision-und-Flotten-Schule (Tesla und wenige andere) wächst, indem sie Grenzfälle in der Kundenflotte einsammelt und durcharbeitet. Kein Zyklus ist abstrakt „schneller“; sie gehen unterschiedliche Risiken ein.",
      },
      {
        en: "A useful question is not 'what level is it?' but 'who is legally the driver, in which domain, with what fallback, and who holds the keys when it fails?' That question maps cleanly onto UNECE automation categories and German StVG obligations, and poorly onto a single SAE integer.",
        de: "Die bessere Frage ist nicht „welches Level?“, sondern: wer ist rechtlich der Fahrer, in welchem Bereich, mit welchem Rückfall, und wer hat im Fehlerfall die Kontrolle? Das lässt sich sauber auf UNECE-Kategorien und das StVG abbilden, und schlecht auf eine einzelne SAE-Zahl.",
      },
    ],
  },
  {
    slug: "speed-vs-safety",
    kind: "tool",
    category: "autonomous-driving",
    date: "2026-04",
    image: "/images/research-speed-safety.jpg",
    title: {
      en: "Speed vs Safety Tool",
      de: "Tempo vs. Sicherheit",
    },
    dek: {
      en: "Interactive explainer for how speed, reaction time, and road grip affect stopping distance, impact energy, and pedestrian injury risk.",
      de: "Interaktives Modell: Wie Tempo, Reaktionszeit und Griffigkeit Anhalteweg, Aufprallenergie und Verletzungsrisiko für Fußgänger verändern.",
    },
    tags: [
      { en: "Physics", de: "Physik" },
      { en: "VRU", de: "VRU" },
    ],
    paragraphs: [
      {
        en: "Kinetic energy scales with the square of speed. Braking distance does too. That is why a 'slightly faster' urban pass is not a slight change in outcome for a pedestrian. Use the sliders; the geometry is the argument.",
        de: "Kinetische Energie steigt mit dem Quadrat der Geschwindigkeit. Der Bremsweg ebenfalls. Deshalb ist ein „bisschen schnelleres“ Tempo in der Stadt keine kleine Änderung im Ausgang für Fußgänger. Drehen Sie an den Reglern; die Geometrie ist das Argument.",
      },
    ],
  },
  {
    slug: "tesla-ecosystem",
    kind: "tracker",
    category: "muskonomy",
    date: "2026-05",
    image: "/images/research-ecosystem.jpg",
    title: {
      en: "Tesla Ecosystem",
      de: "Tesla-Ökosystem",
    },
    dek: {
      en: "Historical data tracking the financial evolution of Full Self-Driving technology: package price, subscription, and the Robotaxi story sitting on top of it.",
      de: "Historische Daten zur finanziellen Entwicklung von Full Self-Driving: Paketpreis, Abo und die Robotaxi-Erzählung darüber.",
    },
    tags: [
      { en: "FSD pricing", de: "FSD-Preise" },
      { en: "Robotaxi", de: "Robotaxi" },
    ],
    paragraphs: [
      {
        en: "FSD has been sold as a feature, a subscription, an equity story, and a future robotaxi claim. The package price on the window sticker is only one line in that ledger. Compiled below from public announcements; not investment advice.",
        de: "FSD wurde als Funktion, als Abo, als Börsengeschichte und als künftige Robotaxi-Behauptung verkauft. Der Paketpreis auf dem Aufkleber ist nur eine Zeile in diesem Buch. Unten zusammengestellt aus öffentlichen Angaben; keine Anlageberatung.",
      },
      {
        en: "Read the price path as a demand and positioning experiment, not as a cost-plus. When the unsupervised and robotaxi narratives heat up, the option is framed as an appreciating asset. When take-rate matters more, it is framed as a software attach. Both frames can be true in different quarters.",
        de: "Den Preispfad als Nachfrage- und Positionierungsexperiment lesen, nicht als Kostenaufschlag. Wenn Unsupervised und Robotaxi heißlaufen, wird die Option zum wertsteigernden Asset. Wenn die Abschlussquote zählt, wird sie zum Software-Zusatz. Beide Lesarten können in unterschiedlichen Quartalen stimmen.",
      },
    ],
  },
  {
    slug: "ai-robotics",
    kind: "map",
    category: "robotics",
    date: "2026-07",
    image: "/images/research-robotics.jpg",
    title: {
      en: "AI & Robotics",
      de: "KI & Robotik",
    },
    dek: {
      en: "Mapping the humanoid robotics landscape and the technological stack: actuation, compute, teleoperation, and the policy problems nobody puts in the keynote.",
      de: "Die Humanoide-Landschaft und der technische Stack: Aktorik, Rechenleistung, Teleoperation, und die Regulierungsfragen, die es nicht in die Keynote schaffen.",
    },
    tags: [
      { en: "Humanoids", de: "Humanoide" },
      { en: "Stack", de: "Stack" },
    ],
    paragraphs: [
      {
        en: "A humanoid is a bet that the world is already built for humans, so the robot should be too. The stack underneath that bet is not one product: actuators and gearboxes, battery and thermal, hands, onboard compute, foundation models, teleoperation for data, and a safety case that industrial regulators will actually accept.",
        de: "Ein Humanoid ist die Wette, dass die Welt für Menschen gebaut ist, also auch der Roboter so sein sollte. Der Stack darunter ist kein einzelnes Produkt: Aktorik, Getriebe, Batterie und Thermik, Hände, Rechenleistung an Bord, Foundation Models, Teleoperation für Daten, und ein Sicherheitsnachweis, den die Industrieaufsicht wirklich akzeptiert.",
      },
      {
        en: "The interesting split in 2026 is not 'who has a demo'. It is who is collecting real hours in a real workplace, who still depends on a puppeteer, and who has a path from supervised factory tasks to unsupervised ones without rewriting the safety case every quarter.",
        de: "Die interessante Trennung 2026 ist nicht, wer eine Demo hat. Sondern: wer sammelt echte Stunden am echten Arbeitsplatz, wer hängt noch am Puppenspieler, und wer hat einen Weg von überwachten Fabrikaufgaben zu unüberwachten, ohne jedes Quartal den Sicherheitsnachweis neu zu schreiben.",
      },
    ],
  },
  {
    slug: "fsd-matrix",
    kind: "matrix",
    category: "autonomous-driving",
    date: "2026-08",
    image: "/images/research-fsd-matrix.jpg",
    title: {
      en: "Tesla FSD Assessment Matrix",
      de: "Tesla-FSD-Bewertungsmatrix",
    },
    dek: {
      en: "Public assessment matrix of the state of FSD: a subjective take by the author, from daily supervised driving in the US.",
      de: "Öffentliche Bewertungsmatrix zum Stand von FSD: subjektive Einordnung des Autors, aus dem beaufsichtigten Alltag in den USA.",
    },
    tags: [
      { en: "FSD Supervised", de: "FSD Supervised" },
      { en: "Author's take", de: "Einschätzung" },
    ],
    paragraphs: [
      {
        en: "This is not Tesla's scorecard and not a regulator's. It is mine, updated from daily supervised driving around Boston and on US highways. Scores are 1–5. Five does not mean unsupervised; it means 'I rarely intervene in this class of scene'. One means 'I treat it as a demo, not a driver'.",
        de: "Das ist nicht Teslas Bewertung und nicht die einer Aufsichtsbehörde. Es ist meine, fortgeschrieben aus beaufsichtigtem Alltag um Boston und auf US-Highways. Skala 1–5. Fünf heißt nicht Unsupervised; es heißt: in dieser Szenenklasse greife ich selten ein. Eins heißt: Demo, kein Fahrer.",
      },
    ],
  },
  {
    slug: "waymo",
    kind: "tracker",
    category: "autonomous-driving",
    date: "2026-08",
    image: "/images/research-waymo.jpg",
    title: {
      en: "Waymo Rollout",
      de: "Waymo-Rollout",
    },
    dek: {
      en: "Tracking Waymo's autonomous vehicle deployment and market expansion: cities, service mode, and what 'driverless' actually covers.",
      de: "Waymos Ausrollen und Marktexpansion: Städte, Betriebsmodus, und was „fahrerlos“ tatsächlich abdeckt.",
    },
    tags: [
      { en: "Robotaxi", de: "Robotaxi" },
      { en: "ODD", de: "ODD" },
    ],
    paragraphs: [
      {
        en: "Waymo is the existence proof that a geofenced, heavily mapped, multi-sensor L4 service can carry passengers without a person in the seat. The question for 2026 is not 'does it work in Phoenix'. It is how expensive each new city is, how weather and density punish the ODD, and how fast the playbook copies.",
        de: "Waymo ist der Existenzbeweis, dass ein räumlich begrenzter, stark kartierter, multisensorischer L4-Dienst Fahrgäste ohne Person auf dem Sitz befördern kann. Die Frage 2026 ist nicht, ob Phoenix funktioniert. Sondern: wie teuer jede neue Stadt ist, wie Wetter und Dichte den Einsatzbereich belasten, und wie schnell sich das Vorgehen kopieren lässt.",
      },
    ],
  },
  {
    slug: "muskonomy",
    kind: "map",
    category: "muskonomy",
    date: "2026-06",
    image: "/images/research-muskonomy.jpg",
    noBanner: true,
    // German copy: Colleen's localization (Oct 21 2026; title/dek updated Oct 21 2026).
    title: {
      en: "SpaceXSI and Tesla: Who Needs Whom More?",
      de: "SpaceXSI und Tesla: Wer braucht wen mehr?",
    },
    dek: {
      en: "An analysis of key technologies, products, and services that each company provides for the other.",
      de: "Eine Analyse der wichtigsten Technologien, Produkte und Dienstleistungen, die sich die beiden Unternehmen gegenseitig liefern.",
    },
    tags: [
      { en: "Muskonomy", de: "Muskonomy" },
      { en: "Dependencies", de: "Abhängigkeiten" },
    ],
    paragraphs: [],
  },
  {
    slug: "tesla-gruenheide",
    videoId: "fC7smnPZzmQ",
    kind: "tool",
    category: "robotics",
    date: "2026-11",
    published: "2026-11-10",
    image: "/images/research-tesla-gruenheide.jpg",
    noBanner: true,
    // Title/dek from Tobias's dashboard file (Nov 10 2026); EN is a translation.
    title: {
      en: "Giga Berlin: Workforce & Optimus 10-Year Projection",
      de: "Giga Berlin: Belegschaft & Optimus 10-Jahres-Projektion",
    },
    dek: {
      en: "Workforce milestones at Tesla's Gigafactory Berlin-Brandenburg since 2022, and three scenarios for how Optimus could reshape staffing in Grünheide through 2036.",
      de: "Meilensteine der Belegschaft in Teslas Gigafactory Berlin-Brandenburg seit 2022 und drei Zukunfts-Szenarien, wie Optimus den Personalbedarf in Grünheide bis 2036 verändern könnte.",
    },
    tags: [
      { en: "Giga Berlin", de: "Giga Berlin" },
      { en: "Optimus", de: "Optimus" },
    ],
    paragraphs: [],
  },
  {
    slug: "mercedes-mb-drive-assist-pro",
    videoId: "dpFS0SMJIC8",
    kind: "tool",
    category: "autonomous-driving",
    date: "2026-11",
    published: "2026-11-17",
    image: "/images/research-mercedes-mb-drive-assist-pro.jpg",
    noBanner: true,
    // Page title from Interactive Slides / Tobias (Nov 17 2026). Dek from the deck meta description; EN is a translation.
    // Card title/dek from Tobias (Nov 17 2026); EN is a translation. Detail page and SEO keep title/dek.
    title: {
      en: "Mercedes MB.DRIVE ASSIST PRO: What's New in November?",
      de: "Mercedes MB.DRIVE ASSIST PRO: Was ist neu im November?",
    },
    dek: {
      en: "The eight key points of the Mercedes-Benz press release of November 16, 2026 on MB.DRIVE ASSIST PRO.",
      de: "Die acht Kernpunkte der Mercedes-Benz Pressemitteilung vom 16. November 2026 zu MB.DRIVE ASSIST PRO.",
    },
    cardTitle: {
      en: "Mercedes MB.DRIVE ASSIST PRO",
      de: "Mercedes MB.DRIVE ASSIST PRO",
    },
    cardDek: {
      en: "An ongoing analysis of Mercedes's announced L2++ system",
      de: "Eine fortlaufende Analyse des angekündigten L2++-Systems von Mercedes",
    },
    tags: [
      { en: "Mercedes", de: "Mercedes" },
      { en: "Driver assistance", de: "Fahrerassistenz" },
    ],
    paragraphs: [],
  },
  {
    slug: "tuev-adac-ev-tests",
    videoId: "1gjQ84Uj8N4",
    kind: "tool",
    category: "muskonomy",
    date: "2026-11",
    published: "2026-11-19",
    image: "/images/research-tuev-adac-ev-tests.jpg",
    noBanner: true,
    // Page title from Colleen / Tobias (Nov 19 2026). Dek = card dek (generic TÜV & ADAC framing).
    // Card title/dek from Tobias (Nov 19 2026) via Colleen. Detail page and SEO keep title/dek.
    title: {
      en: "Why Tesla Ranks Low in TÜV Tests",
      de: "Warum Tesla beim TÜV hinten liegt",
    },
    dek: {
      en: "An analysis of Germany's major inspection and breakdown stats, with a focus on Tesla",
      de: "Eine Analyse der großen deutschen Prüf- und Pannenstatistiken mit Fokus auf Tesla",
    },
    cardTitle: {
      en: "TÜV & ADAC EV Tests",
      de: "TÜV & ADAC E-Auto-Tests",
    },
    cardDek: {
      en: "An analysis of Germany's major inspection and breakdown stats, with a focus on Tesla",
      de: "Eine Analyse der großen deutschen Prüf- und Pannenstatistiken mit Fokus auf Tesla",
    },
    tags: [
      { en: "TÜV", de: "TÜV" },
      { en: "ADAC", de: "ADAC" },
      { en: "Tesla", de: "Tesla" },
    ],
    paragraphs: [],
  },
  {
    slug: "vw-automatisiertes-fahren",
    kind: "tool",
    category: "autonomous-driving",
    date: "2026-11",
    published: "2026-11-24",
    image: "/images/research-vw-automatisiertes-fahren.jpg",
    noBanner: true,
    // Title from the deck. Page dek from the deck meta description (without
    // the trailing as-of date). Card dek from the deck intro, without the
    // "Research as of ..." / "Recherche mit Stand ..." prefix. COPY-REVIEW.
    title: {
      en: "VW and Automated Driving",
      de: "VW und automatisiertes Fahren",
    },
    dek: {
      en: "The Volkswagen Group and automated driving (ADAS and ADS): what is on German roads today, the technology and partners behind it, and what is planned to arrive by 2028.",
      de: "Volkswagen Konzern und automatisiertes Fahren (ADAS und ADS): was heute auf deutschen Straßen fährt, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll.",
    },
    cardDek: {
      en: "What VW, Audi, and Porsche offer today, the technology and partners behind it, and what is planned to arrive by 2028",
      de: "Was VW, Audi und Porsche heute bieten, welche Technik und Partner dahinterstehen und was bis 2028 kommen soll",
    },
    tags: [
      { en: "Volkswagen", de: "Volkswagen" },
      { en: "ADAS", de: "ADAS" },
      { en: "ADS", de: "ADS" },
    ],
    paragraphs: [],
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
      de: "Die reifste Klasse. Aufsicht bleibt Pflicht beim Einfädeln, bei Einsatzfahrzeugen und bei plötzlichem Verzögern.",
    },
  },
  {
    id: "urban",
    label: { en: "Urban streets", de: "Stadtstraßen" },
    score: 4,
    note: {
      en: "Boston suburbs and tight neighborhoods are largely usable. Construction and dual-parked streets still draw interventions.",
      de: "Bostoner Vororte und enge Viertel sind weitgehend nutzbar. Baustellen und doppeltes Parken erzwingen weiter Eingriffe.",
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
      de: "Grundsätzlich vorsichtig. Gelegentliches Nachrollen am Fußgängerüberweg dokumentiere ich weiter.",
    },
  },
  {
    id: "night",
    label: { en: "Night", de: "Nacht" },
    score: 4,
    note: {
      en: "Vision stack holds up. Poorly lit rural edges and glare remain the watch items.",
      de: "Der Vision-Stack hält stand. Schlecht ausgeleuchtete Ortsränder und Blendung bleiben Beobachtungspunkte.",
    },
  },
  {
    id: "precip",
    label: { en: "Rain & fog", de: "Regen & Nebel" },
    score: 3,
    note: {
      en: "Wet Boston winters are a real test. Heavy spray and fog still degrade confidence.",
      de: "Nasse Boston-Winter sind ein echter Test. Gischt und Nebel senken die Konfidenz des Systems.",
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
      de: "Bessere Erkennung, uneinheitliches Verhalten beim Freimachen der Spur. Die nehme ich weiter selbst.",
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
      de: "Keine Produktbehauptung von mir. Als täglicher Nutzer mit Aufsicht: noch nicht, nicht hier, nicht in diesem Wetter-Mix.",
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
      de: "Begrenzte Fabrikaufgaben; öffentliche Demos liegen vor unüberwachten Stunden",
    },
  },
  {
    name: "Figure",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Humanoid + BMW-class manufacturing pilots, foundation-model bets",
      de: "Humanoid plus Fertigungspiloten auf BMW-Niveau, Wette auf Foundation Models",
    },
    status: {
      en: "High-visibility pilots; teleop still in the data loop",
      de: "Sichtbare Piloten; Teleoperation weiter in der Datenschleife",
    },
  },
  {
    name: "Boston Dynamics Atlas",
    hq: { en: "USA", de: "USA" },
    stack: {
      en: "Electric Atlas, world-class mobility, Hyundai industrial path",
      de: "Elektrisches Atlas, Beweglichkeit auf Weltniveau, industrieller Hyundai-Pfad",
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
      de: "Zweibeiner für Logistik, Lagerarbeit im GXO-Stil",
    },
    status: {
      en: "Early commercial hours; form factor is the thesis",
      de: "Frühe kommerzielle Stunden; der Formfaktor ist die These",
    },
  },
  {
    name: "1X Neo",
    hq: { en: "Norway / USA", de: "Norwegen / USA" },
    stack: {
      en: "Soft-robotics bias, home thesis, tendon-driven hardware",
      de: "Hang zu Soft Robotics, These Haushalt, sehnengetriebene Hardware",
    },
    status: {
      en: "Consumer narrative, safety case still the gate",
      de: "Konsumenten-Erzählung; der Sicherheitsnachweis bleibt die Hürde",
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
      de: "Hardware zugänglich; der Stack holt öffentlich auf",
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
      de: "Europäische Alternative im Gespräch",
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
      de: "Die ursprüngliche kommerzielle Betriebszone. Referenzstadt für kartiertes L4 bei einfachem Wetter.",
    },
  },
  {
    city: { en: "San Francisco", de: "San Francisco" },
    since: "2024",
    mode: { en: "Public robotaxi", de: "Öffentliches Robotaxi" },
    note: {
      en: "Density, hills, and politics. The city that taught everyone else about edge cases and city hall.",
      de: "Dichte, Hügel, Politik. Die Stadt, die alle anderen Grenzfälle und Stadtpolitik gelehrt hat.",
    },
  },
  {
    city: { en: "Los Angeles", de: "Los Angeles" },
    since: "2024",
    mode: { en: "Public robotaxi", de: "Öffentliches Robotaxi" },
    note: {
      en: "Scale play. Freeways plus sprawl: a different ODD than the grid of SF.",
      de: "Ein Spiel um Größe. Freeways plus Fläche: ein anderer Einsatzbereich als das Raster von San Francisco.",
    },
  },
  {
    city: { en: "Austin", de: "Austin" },
    since: "2025",
    mode: { en: "Service expanding", de: "Service im Ausbau" },
    note: {
      en: "Overlaps the Tesla robotaxi conversation geographically. Useful for side-by-side watching.",
      de: "Geografische Überlappung mit der Tesla-Robotaxi-Debatte. Nützlich für den Direktvergleich.",
    },
  },
  {
    city: { en: "Atlanta", de: "Atlanta" },
    since: "2025",
    mode: { en: "Service expanding", de: "Service im Ausbau" },
    note: {
      en: "Airport and highway mix. A test of whether the playbook survives humidity and Southern sprawl.",
      de: "Mix aus Flughafen und Fernstraßen. Test, ob das Vorgehen Luftfeuchtigkeit und südliche Vorstadtfläche übersteht.",
    },
  },
  {
    city: { en: "Further metros", de: "Weitere Metropolen" },
    since: "2026",
    mode: { en: "Announced / staged", de: "Angekündigt / vorbereitet" },
    note: {
      en: "The 2026 question is cadence: how many new ODDs per year before the map-and-ops cost dominates.",
      de: "Die Frage 2026 ist der Takt: wie viele neue Einsatzgebiete pro Jahr, bevor Karten- und Betriebskosten dominieren.",
    },
  },
];

export function getResearchCategory(slug: string): ResearchCategory | undefined {
  return RESEARCH_CATEGORIES.find((item) => item.slug === slug);
}

export function isResearchCategorySlug(value: string): value is ResearchCategorySlug {
  return RESEARCH_CATEGORY_SLUGS.includes(value as ResearchCategorySlug);
}

const ALL_RESEARCH_LOCALES: readonly Locale[] = ["en", "de"];

/** Locales this piece is published in (default: both). */
export function researchPublishedLocales(piece: ResearchPiece): readonly Locale[] {
  return piece.locales ?? ALL_RESEARCH_LOCALES;
}

export function isResearchPublished(piece: ResearchPiece, locale: Locale): boolean {
  return researchPublishedLocales(piece).includes(locale);
}

/** Pieces in a category, newest first (same month: later entry in `research` first). */
export function researchInCategory(slug: ResearchCategorySlug, locale?: Locale): ResearchPiece[] {
  return research
    .map((piece, index) => ({ piece, index }))
    .filter(({ piece }) => piece.category === slug && (!locale || isResearchPublished(piece, locale)))
    .sort((a, b) => b.piece.date.localeCompare(a.piece.date) || b.index - a.index)
    .map(({ piece }) => piece);
}

/** All pieces newest first (same month: later entry in `research` first). */
export function researchNewestFirst(locale?: Locale): ResearchPiece[] {
  return research
    .map((piece, index) => ({ piece, index }))
    .filter(({ piece }) => !locale || isResearchPublished(piece, locale))
    .sort((a, b) => b.piece.date.localeCompare(a.piece.date) || b.index - a.index)
    .map(({ piece }) => piece);
}

/** The newest `count` pieces (home page "Research" row). */
export function newestResearch(count = 3, locale?: Locale): ResearchPiece[] {
  return researchNewestFirst(locale).slice(0, count);
}

/**
 * "More research" under a piece: other pieces from the same topic, newest
 * first, topped up with the newest pieces from other topics.
 */
export function relatedResearch(slug: ResearchSlug, count = 3, locale?: Locale): ResearchPiece[] {
  const piece = getResearch(slug);
  const sameTopic = piece
    ? researchInCategory(piece.category, locale).filter((item) => item.slug !== slug)
    : [];
  const picked = sameTopic.slice(0, count);
  for (const item of researchNewestFirst(locale)) {
    if (picked.length >= count) break;
    if (item.slug !== slug && !picked.includes(item)) picked.push(item);
  }
  return picked;
}

/** Short title used on cards and category tiles. */
export function researchCardTitle(piece: ResearchPiece, locale: Locale): string {
  return piece.cardTitle?.[locale] ?? piece.title[locale];
}

/** Mechanical meta description for a category page: label plus piece titles. */
export function researchCategoryDescription(slug: ResearchCategorySlug, locale: Locale): string {
  const category = getResearchCategory(slug)!;
  const titles = researchInCategory(slug, locale).map((piece) => researchCardTitle(piece, locale));
  return `${category.label[locale]}: ${titles.join(", ")}.`;
}

export const RESEARCH_CATEGORY_TITLE_SUFFIX = {
  en: "Research · TechTalkTobi",
  de: "Recherche · TechTalkTobi",
} as const;

export function researchCategoryTitle(slug: ResearchCategorySlug, locale: Locale): string {
  return `${getResearchCategory(slug)!.label[locale]} · ${RESEARCH_CATEGORY_TITLE_SUFFIX[locale]}`;
}
