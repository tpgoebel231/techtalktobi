import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/pages/assistant";

export const Route = createFileRoute("/$locale/assistant")({
  component: AssistantPage,
  head: () => ({
    meta: [{ title: "Helga · TechTalkTobi" }],
  }),
});
