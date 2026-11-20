import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/about";

const DESCRIPTION = {
  en: "Content and advisory on autonomous driving systems (robotaxis, driver assistance), AI, and robotics.",
  de: "Content und Beratung zu autonomen Fahrsystemen (Robotaxis, Fahrerassistenz), KI und Robotik.",
} as const;

const TITLE = {
  en: "Tobias P. Goebel: About · TechTalkTobi",
  de: "Tobias P. Goebel: Über mich · TechTalkTobi",
} as const;

export const Route = createFileRoute("/$locale/about")({
  component: AboutPage,
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
