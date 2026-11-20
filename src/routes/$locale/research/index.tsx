import { createFileRoute } from "@tanstack/react-router";
import { ResearchIndexPage } from "@/pages/research-index";

const TITLES = {
  en: "Research · TechTalkTobi",
  de: "Recherche · TechTalkTobi",
} as const;

const DESCRIPTION = {
  en: "I dive deeper into the self-driving vehicle industry, analyze the emerging humanoid robotics space, and cover the general Elon Musk ecosystem: AI, AV technologies and regulation, robotaxis, EVs, and more.",
  de: "Ich steige tiefer ein in autonome Fahrzeuge, analysiere den aufkommenden Markt für humanoide Roboter, und decke allgemein das Elon Musk Ökosystem ab: KI, automatisiertes Fahren, Robotaxis, E-Autos, und mehr.",
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
