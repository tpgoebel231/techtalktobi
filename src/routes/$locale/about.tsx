import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/about";

const DESCRIPTION = {
  en: "Content and advisory on autonomous driving systems (robotaxis, driver assistance), AI, and robotics.",
  de: "Content und Beratung zu autonomen Fahrsystemen (Robotaxis, Fahrerassistenz), KI und Robotik.",
} as const;

export const Route = createFileRoute("/$locale/about")({
  component: AboutPage,
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    return {
      meta: [
        { title: "About · TechTalkTobi" },
        { name: "description", content: DESCRIPTION[locale] },
      ],
    };
  },
});
