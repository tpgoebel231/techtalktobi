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
      en: "Impressive progress in robotics: exclusive impressions from Robotics Expo 2026 Boston",
      de: "Beeindruckende Fortschritte in der Robotik: Exklusive Eindrücke von der Robotics Expo 2026 Boston",
    },
    channel: "reports",
    topic: "reports",
  },
];

// Localized samples: DE picks target a German/DACH audience, EN picks a US audience.
export const teslaTobiVideos: Record<Locale, Video[]> = {
  de: [
    {
      id: "MYy-XYcn22A",
      title: {
        en: "How exactly (and why?) a super AI could actually wipe out humanity",
        de: "Wie genau (und warum eigentlich??) eine Super-KI tatsächlich die Menschheit ausrotten könnte",
      },
      channel: "teslatobi",
      topic: "ai-society",
    },
    {
      id: "Guh-ZArDzv4",
      title: {
        en: "Getting started with Grok Bot: what Elon Musk's new AI assistant can actually do",
        de: "Erste Schritte mit Grok Bot: Was dieser krasse neue KI-Assistent von Elon Musk alles kann",
      },
      channel: "teslatobi",
      topic: "ai-society",
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
      id: "w75L3SeEgKA",
      title: {
        en: "ADAC tests Tesla: did FSD really run a red light?",
        de: "ADAC testet Tesla: Hat FSD wirklich eine rote Ampel überfahren?",
      },
      channel: "teslatobi",
      topic: "self-driving",
    },
    {
      id: "uvbbrUtNwSo",
      title: {
        en: "Transport minister: Tesla FSD is coming to Europe, but under a new name",
        de: "Verkehrsminister: Tesla FSD kommt nach Europa! Wird aber umbenannt.",
      },
      channel: "teslatobi",
      topic: "self-driving",
    },
    {
      id: "_mH2BBknCTk",
      title: {
        en: "Tesla Optimus V3: mass production ahead. Strategy or Musk hype?",
        de: "Tesla Optimus V3: Massenproduktion steht bevor. Strategie oder Musk-Hype?",
      },
      channel: "teslatobi",
      topic: "robotics",
    },
    {
      id: "uObXl89zyYE",
      title: {
        en: "Digital Optimus and Macrohard: Elon's challenge to the tech giants",
        de: "Digital Optimus und Macrohard: Elons Kampfansage an die Tech-Giganten",
      },
      channel: "teslatobi",
      topic: "robotics",
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
  ],
  en: [
    {
      id: "MYy-XYcn22A",
      title: {
        en: "How exactly (and why?) a super AI could actually wipe out humanity",
        de: "Wie genau (und warum eigentlich??) eine Super-KI tatsächlich die Menschheit ausrotten könnte",
      },
      channel: "teslatobi",
      topic: "ai-society",
    },
    {
      id: "GZH1Y9vOlYs",
      title: {
        en: "Elon Musk at All-In: how we could better control AI",
        de: "Elon Musk bei All-In: So könnten wir KI besser kontrollieren",
      },
      channel: "teslatobi",
      topic: "ai-society",
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
      id: "WyxAuECNoYI",
      title: {
        en: "Why a Tesla will be your next car: 11 reasons, and 4 things only Tesla can do",
        de: "Warum ein Tesla Dein nächstes Auto wird: 11 Gründe, und 4 Dinge, die so nur Tesla kann",
      },
      channel: "teslatobi",
      topic: "self-driving",
    },
    {
      id: "wDrZx0vRJ0Q",
      title: {
        en: "Tesla will NEVER license FSD to other automakers",
        de: "Tesla wird FSD *NIEMALS* an andere Hersteller lizensieren",
      },
      channel: "teslatobi",
      topic: "self-driving",
    },
    {
      id: "4HXrFY8bKh0",
      title: {
        en: "Tesla FSD 13 now drives better than human drivers",
        de: "Tesla FSD 13 fährt mittlerweile besser als menschliche Fahrer",
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
  ],
};

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
    id: "cURqO-Pks0U",
    title: {
      en: "How I taught my Grok Bot AI to speak like a human on the phone and not get a hang-up",
      de: "Wie ich meinem Grok-Bot-KI-Assistenten beigebracht habe, am Telefon wie ein Mensch zu sprechen",
    },
    channel: "techtalktobi",
    topic: "robotics",
  },
  {
    id: "mfNZqnblIPo",
    title: {
      en: "Is AI really dangerous? A simple explanation",
      de: "Ist KI wirklich gefährlich? Einfach erklärt",
    },
    channel: "techtalktobi",
    topic: "ai-society",
  },
  {
    id: "iquGLaKwbhQ",
    title: {
      en: "I think I just cracked the Musk Method of running his orgs",
      de: "Ich glaube, ich habe Musks Methode der Unternehmensführung entschlüsselt",
    },
    channel: "techtalktobi",
    topic: "ai-society",
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
    id: "xDonoPGwHWI",
    title: {
      en: "Cybercab launch: highlights and the full stage presentation by the Tesla team",
      de: "Cybercab-Launch: Highlights und die komplette Bühnenpräsentation des Tesla-Teams",
    },
    channel: "techtalktobi",
    topic: "self-driving",
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
    id: "Q01JG1-jSGQ",
    title: {
      en: "Tesla FSD Supervised needs to change before it can come to Europe, and here is why",
      de: "Tesla FSD Supervised muss sich ändern, bevor es nach Europa kommen kann, und hier ist der Grund",
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
  costInMyCity: "https://costinmycity.com",
  mediaKit: "/TeslaTobi_MediaKit_Oct_2026.pdf",
  cv: "/cv/tobias-p-goebel-cv.pdf",
  // German CV target. Switch to the German PDF once it is approved.
  cvDe: "/cv/tobias-p-goebel-lebenslauf.pdf",
};

export function cvHref(locale: string) {
  return locale === "de" ? links.cvDe : links.cv;
}

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
