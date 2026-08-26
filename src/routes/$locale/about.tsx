import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/pages/about";

export const Route = createFileRoute("/$locale/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "About · TechTalkTobi" }],
  }),
});
