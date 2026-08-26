import { createFileRoute } from "@tanstack/react-router";
import { MediaKitPage } from "@/pages/media-kit";

export const Route = createFileRoute("/$locale/media-kit")({
  component: MediaKitPage,
  head: () => ({
    meta: [{ title: "Media kit · TechTalkTobi" }],
  }),
});
