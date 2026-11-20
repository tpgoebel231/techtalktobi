import { createFileRoute, redirect } from "@tanstack/react-router";
import { impressum } from "@/data/impressum";
import { ImpressumPage } from "@/pages/impressum";

export const Route = createFileRoute("/$locale/imprint")({
  beforeLoad: ({ params }) => {
    if (params.locale !== "en") {
      throw redirect({ to: "/$locale/impressum", params: { locale: "de" } });
    }
  },
  component: ImpressumPage,
  head: () => ({
    meta: [
      { title: `${impressum.en.title} · TechTalkTobi` },
      { name: "description", content: impressum.en.description },
    ],
  }),
});
