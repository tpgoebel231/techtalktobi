import type { Locale } from "@/lib/locale";

export type Video = {
  id: string;
  title: Record<Locale, string>;
  channel: "teslatobi" | "techtalktobi";
};

export const teslaTobiVideos: Video[] = [
  {
    id: "j9NHKEZNngc",
    title: {
      en: "Dangerous traffic situations — Tesla FSD acts like a champ",
      de: "Gefährliche Verkehrslagen — Tesla FSD hält sich wacker",
    },
    channel: "teslatobi",
  },
  {
    id: "Uj7gWJBCMek",
    title: {
      en: "Tesla FSD 14.1.3 — first drive with the new version",
      de: "Tesla FSD 14.1.3 — erste Fahrt mit der neuen Version",
    },
    channel: "teslatobi",
  },
  {
    id: "i-4BKMaB_Jo",
    title: {
      en: "FSD 14 through the drive-thru",
      de: "FSD 14 durch den Drive-thru",
    },
    channel: "teslatobi",
  },
  {
    id: "YSrekbylDRU",
    title: {
      en: "Clarity for HW3 owners: what Elon actually said",
      de: "Klarheit für HW3-Besitzer: was Elon wirklich gesagt hat",
    },
    channel: "teslatobi",
  },
  {
    id: "L91-oc-e5Rk",
    title: {
      en: "FSD Supervised in Europe — why the authorities have a point",
      de: "FSD Supervised in Europa — warum die Behörden einen Punkt haben",
    },
    channel: "teslatobi",
  },
  {
    id: "XqeYcjH9iFM",
    title: {
      en: "When can HW3 owners expect FSD v14?",
      de: "Wann können HW3-Besitzer FSD v14 erwarten?",
    },
    channel: "teslatobi",
  },
];

export const techTalkVideos: Video[] = [
  {
    id: "q5xAIei9la4",
    title: {
      en: "Welcome to Tech Talk Tobi",
      de: "Willkommen bei Tech Talk Tobi",
    },
    channel: "techtalktobi",
  },
];

export const channels = {
  teslatobi: {
    handle: "@TeslaTobi",
    url: "https://www.youtube.com/@TeslaTobi",
    name: { en: "TeslaTobi", de: "TeslaTobi" },
    lang: { en: "German", de: "Deutsch" },
    stats: { en: "German FSD desk · 500+ films", de: "Deutsche FSD-Redaktion · 500+ Filme" },
  },
  techtalktobi: {
    handle: "@TechTalk-Tobi",
    url: "https://www.youtube.com/@TechTalk-Tobi",
    name: { en: "TechTalkTobi", de: "TechTalkTobi" },
    lang: { en: "English", de: "Englisch" },
    stats: { en: "English analysis desk", de: "Englischer Analyse-Desk" },
  },
} as const;

export type Report = {
  slug: string;
  date: string;
  image: string;
  title: Record<Locale, string>;
  dek: Record<Locale, string>;
  body: Array<Record<Locale, string>>;
};

export const reports: Report[] = [
  {
    slug: "robotaxi-week",
    date: "2026-07",
    image: "/images/research-waymo.jpg",
    title: {
      en: "Robotaxi week-one notes",
      de: "Robotaxi: Notizen aus Woche eins",
    },
    dek: {
      en: "A TV-style field report from overlapping service areas — what the passenger actually sees when two stacks share a city.",
      de: "TV-naher Feldbericht aus überlappenden Servicegebieten — was Fahrgäste sehen, wenn zwei Stacks eine Stadt teilen.",
    },
    body: [
      {
        en: "The interesting picture is not a single viral clip. It is the choreography of pickup, the way a vehicle holds a lane in a rain cell, and whether the cabin feels like a taxi or a science project.",
        de: "Das interessante Bild ist nicht ein viraler Clip. Es ist die Choreographie der Abholung, wie ein Fahrzeug in einer Regenwalze die Spur hält, und ob die Kabine sich nach Taxi oder nach Versuchsanordnung anfühlt.",
      },
      {
        en: "I shot this as a report, not a review: timestamps, locations, and the moments a safety operator — or the absence of one — changes the social contract in the back seat.",
        de: "Gedreht als Report, nicht als Review: Zeitstempel, Orte, und die Momente, in denen ein Safety Operator — oder sein Fehlen — den Sozialvertrag auf der Rückbank ändert.",
      },
    ],
  },
  {
    slug: "fsd-europe-briefing",
    date: "2026-03",
    image: "/images/media-field.jpg",
    title: {
      en: "FSD and Europe: a briefing in plain language",
      de: "FSD und Europa: ein Briefing in Klartext",
    },
    dek: {
      en: "What supervised FSD would actually bump into under StVG, AFGBV, and UNECE rules already on the books.",
      de: "Woran beaufsichtigtes FSD unter StVG, AFGBV und bereits geltendem UNECE-Recht konkret stößt.",
    },
    body: [
      {
        en: "European viewers keep asking when FSD is 'coming'. The honest answer is a stack of type-approval, driver-duty, and data questions — not a software toggle. This report walks those layers without the press-release fog.",
        de: "Europäische Zuschauer fragen, wann FSD 'kommt'. Die ehrliche Antwort ist ein Stapel aus Typgenehmigung, Fahrerpflicht und Datenfragen — kein Software-Schalter. Dieser Report geht die Lagen ohne Pressenebel durch.",
      },
    ],
  },
];

export function getReport(slug: string): Report | undefined {
  return reports.find((item) => item.slug === slug);
}

export const links = {
  x: "https://x.com/tpgoebel",
  teslaTobi: "https://www.youtube.com/@TeslaTobi",
  techTalk: "https://www.youtube.com/@TechTalk-Tobi",
  email: "info@techtalktobi.com",
};
