import { createFileRoute } from "@tanstack/react-router";
import { ConsultingPage } from "@/pages/consulting";

export const Route = createFileRoute("/$locale/consulting")({
  component: ConsultingPage,
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.locale === "de"
            ? "Beratung · TechTalkTobi"
            : "Advisory · TechTalkTobi",
      },
    ],
  }),
});
