import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/pages/privacy";

const TITLE = {
  en: "Privacy Policy · TechTalkTobi",
  de: "Datenschutzhinweise zur Google- und YouTube-API · TechTalkTobi",
} as const;

const DESCRIPTION = {
  en: "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.",
  de: "Wie Tobias Goebel den Zugriff auf die Google- und YouTube-API über TechTalkTobi nutzt, um seine eigenen YouTube-Kanäle zu verwalten.",
} as const;

export const Route = createFileRoute("/$locale/privacy")({
  component: PrivacyPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        { title: TITLE[locale] },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
