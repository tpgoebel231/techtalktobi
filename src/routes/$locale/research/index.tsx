import { createFileRoute } from "@tanstack/react-router";
import { ResearchIndexPage } from "@/pages/research-index";

export const Route = createFileRoute("/$locale/research/")({
  component: ResearchIndexPage,
  head: () => ({
    meta: [{ title: "Research · TechTalkTobi" }],
  }),
});
