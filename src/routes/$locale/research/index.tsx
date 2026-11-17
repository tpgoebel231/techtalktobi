import { createFileRoute } from "@tanstack/react-router";
import { ResearchIndexPage } from "@/pages/research-index";

const TITLES = {
  en: "Research · TechTalkTobi",
  de: "Recherche · TechTalkTobi",
} as const;

const DESCRIPTION = {
  en: "Graphics, a public FSD scorecard, and an interactive explainer.",
  de: "Grafiken, eine öffentliche FSD-Bewertungsmatrix und ein interaktiver Rechner.",
} as const;

export const Route = createFileRoute("/$locale/research/")({
  component: ResearchIndexPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        { title: TITLES[locale] },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
