import { createFileRoute, redirect } from "@tanstack/react-router";
import { impressum } from "@/data/impressum";
import { ImpressumPage } from "@/pages/impressum";

export const Route = createFileRoute("/$locale/impressum")({
  beforeLoad: ({ params }) => {
    if (params.locale !== "de") {
      throw redirect({ to: "/$locale/imprint", params: { locale: "en" } });
    }
  },
  component: ImpressumPage,
  head: () => ({
    meta: [
      { title: `${impressum.de.title} · TechTalkTobi` },
      { name: "description", content: impressum.de.description },
    ],
  }),
});
