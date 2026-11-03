import { createFileRoute } from "@tanstack/react-router";
import { ConsultingPage } from "@/pages/consulting";

const DESCRIPTION = {
  en: "Paid, independent briefings. I drive these systems in US daily use and read the European rulebook. That gap is the work.",
  de: "Bezahlte, unabhängige Einordnung auf Deutsch: Stand der Technik, nationales Recht, EU- und UNECE-Regelwerk: was schon gilt, was noch kommt.",
} as const;

export const Route = createFileRoute("/$locale/consulting")({
  component: ConsultingPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        {
          title:
            locale === "de"
              ? "Beratung · TechTalkTobi"
              : "Advisory · TechTalkTobi",
        },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
