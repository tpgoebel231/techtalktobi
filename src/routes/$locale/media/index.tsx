import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/pages/media";

export const Route = createFileRoute("/$locale/media/")({
  component: MediaPage,
  head: () => ({
    meta: [{ title: "Media · TechTalkTobi" }],
  }),
});
