import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/pages/media";

const DESCRIPTION = {
  en: "Two commentary channels and TV-format event reports. For producers, event agencies, and press officers.",
  de: "Zwei Kommentar-Kanäle und Eventberichte im TV-Stil. Für Produktionen, Eventagenturen und Pressestellen.",
} as const;

export const Route = createFileRoute("/$locale/media/")({
  component: MediaPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        { title: "Media · TechTalkTobi" },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
