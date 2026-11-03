import { createFileRoute } from "@tanstack/react-router";
import { MediaKitPage } from "@/pages/media-kit";

const DESCRIPTION = {
  en: "Bio, channels, and contacts for producers, journalists, agencies, and partners.",
  de: "Bio, Kanäle und Kontakt für Redaktionen, Produktionen, Agenturen und Partner.",
} as const;

export const Route = createFileRoute("/$locale/media-kit")({
  component: MediaKitPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        { title: "Media Kit · TechTalkTobi" },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
