import type { Locale } from "@/lib/locale";

export type VideoTopic = "reports" | "robotics" | "self-driving" | "ai-society";

export type Video = {
  id: string;
  title: Record<Locale, string>;
  channel: "teslatobi" | "techtalktobi" | "reports";
  topic: VideoTopic;
};

export const reportVideos: Video[] = [
  {
    id: "YBE-JfTlpf0",
    title: {
      en: "Inaugural race of ProRL: The first professional robotics league in the US",
      de: "Eröffnungslauf der ProRL: Die erste professionelle Robotik-Liga in den USA",
    },
    channel: "reports",
    topic: "reports",
  },
  {
    id: "HeCNKWzG80E",
    title: {
      en: "Impressive progress in robotics — exclusive impressions from Robotics Expo 2026 Boston",
      de: "Beeindruckende Fortschritte in der Robotik — Exklusive Eindrücke von der Robotics Expo 2026 Boston",
    },
    channel: "reports",
    topic: "reports",
  },
];

export const teslaTobiVideos: Video[] = [
  {
    id: "_mH2BBknCTk",
    title: {
      en: "Tesla Optimus V3: Mass production ahead — strategy or Musk hype?",
      de: "Tesla Optimus V3: Massenproduktion steht bevor – Strategie oder Musk-Hype?",
    },
    channel: "teslatobi",
    topic: "robotics",
  },
  {
    id: "uObXl89zyYE",
    title: {
      en: "Digital Optimus and Macrohard: Elon’s challenge to the tech giants",
      de: "Digital Optimus und Macrohard: Elons Kampfansage an die Tech-Giganten",
    },
    channel: "teslatobi",
    topic: "robotics",
  },
  {
    id: "3RNnCa0jSEU",
    title: {
      en: "Tesla rival shows a 24/7 livestream of humanoid robots at work",
      de: "Krass: Tesla-Konkurrent zeigt 24/7-Livestream von humanoiden Robotern bei der Arbeit",
    },
    channel: "teslatobi",
    topic: "robotics",
  },
  {
    id: "dnPNOR_NNSg",
    title: {
      en: "Done with end-to-end AI? A new approach takes on Tesla FSD in Munich",
      de: "Schluss mit End-to-End-KI? Dieser neue Ansatz greift Tesla FSD in München beim autonomen Fahren an",
    },
    channel: "teslatobi",
    topic: "self-driving",
  },
  {
    id: "5kC7SkaC9aw",
    title: {
      en: "Why the whole Tesla LiDAR debate is asking the wrong question",
      de: "Warum die ganze Tesla-LiDAR-Debatte die FALSCHE FRAGE STELLT",
    },
    channel: "teslatobi",
    topic: "self-driving",
  },
  {
    id: "Gs9PdWpSuWY",
    title: {
      en: "Tesla FSD meets a spontaneous fire-department roadblock — my three-way test",
      de: "Tesla FSD wird mit spontaner Straßenblockade durch die Feuerwehr konfrontiert — mein Dreifachtest",
    },
    channel: "teslatobi",
    topic: "self-driving",
  },
  {
    id: "bBy8IwQj08w",
    title: {
      en: "Rural robotaxis: why the Eifel is a Tesla pioneer in Europe, and who may use the service",
      de: "Robotaxis auf dem Land: Warum die Eifel Tesla-Vorreiter in Europa ist und wer den Dienst nutzen darf",
    },
    channel: "teslatobi",
    topic: "self-driving",
  },
];

export const techTalkVideos: Video[] = [
  {
    id: "Q6Z9dfxS1D4",
    title: {
      en: "BREAKTHROUGH: Humanoid Robotics just got their own \"ChatGPT moment\". One-Shot Learning is Now Real!",
      de: "Durchbruch: Humanoide Robotik hat ihren ChatGPT-Moment. One-Shot Learning ist Realität",
    },
    channel: "techtalktobi",
    topic: "robotics",
  },
  {
    id: "29pAii3Jk_w",
    title: {
      en: "Tesla FSD Supervised in Europe, the UK and Japan? New UNECE rules might delay it further",
      de: "Tesla FSD Supervised in Europa, Großbritannien und Japan? Neue UNECE-Regeln könnten es weiter verzögern",
    },
    channel: "techtalktobi",
    topic: "self-driving",
  },
  {
    id: "wtmmbC0c1ms",
    title: {
      en: "AI against populists? A vibe-coded live fact-checker to fight misinformation shows promise",
      de: "KI gegen Populisten? Ein Live-Faktenchecker gegen Desinformation zeigt Potenzial",
    },
    channel: "techtalktobi",
    topic: "ai-society",
  },
  {
    id: "Q01JG1-jSGQ",
    title: {
      en: "Tesla FSD Supervised needs to change before it can come to Europe — and here is why",
      de: "Tesla FSD Supervised muss sich ändern, bevor es nach Europa kommen kann — und hier ist der Grund",
    },
    channel: "techtalktobi",
    topic: "self-driving",
  },
];

export const channels = {
  teslatobi: {
    handle: "@TeslaTobi",
    url: "https://www.youtube.com/@TeslaTobi",
    name: { en: "TeslaTobi", de: "TeslaTobi" },
    lang: { en: "German commentary channel", de: "Deutschsprachiger Kommentar-Kanal" },
    stats: { en: "German commentary channel", de: "Deutschsprachiger Kommentar-Kanal" },
  },
  techtalktobi: {
    handle: "@TechTalk-Tobi",
    url: "https://www.youtube.com/@TechTalk-Tobi",
    name: { en: "TechTalkTobi", de: "TechTalkTobi" },
    lang: { en: "English commentary channel", de: "Englischsprachiger Kommentar-Kanal" },
    stats: { en: "English commentary channel", de: "Englischsprachiger Kommentar-Kanal" },
  },
} as const;

export const links = {
  x: "https://x.com/tpgoebel",
  teslaTobi: "https://www.youtube.com/@TeslaTobi",
  techTalk: "https://www.youtube.com/@TechTalk-Tobi",
  email: "info@techtalktobi.com",
  mediaKit: "/TeslaTobi_MediaKit_July_2026.pdf",
};

export function videosByTopic(list: Video[], topic: VideoTopic) {
  return list.filter((video) => video.topic === topic);
}

export type Report = {
  slug: string;
  date: string;
  image: string;
  title: Record<Locale, string>;
  dek: Record<Locale, string>;
  body: Array<Record<Locale, string>>;
};

export const reports: Report[] = [];

export function getReport(slug: string) {
  return reports.find((item) => item.slug === slug);
}
