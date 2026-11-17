import { createFileRoute } from "@tanstack/react-router";
import { LiveInBonnDetailsPage } from "@/pages/live-in-bonn-details";
import { bonnHead, requireDe } from "@/lib/bonn-route";

const TITLE = "Event-Details · Live in Bonn";
const DESCRIPTION =
  "Event-Details zum TeslaTobi Stammtisch in Bonn. Passwort erforderlich.";

// German-only, noindex, not in the site nav or sitemap.
export const Route = createFileRoute("/$locale/live-in-bonn/details")({
  beforeLoad: ({ params }) => requireDe(params.locale, "/$locale/live-in-bonn/details"),
  head: () => ({
    ...bonnHead(TITLE, DESCRIPTION, { robots: "noindex, nofollow" }),
  }),
  component: LiveInBonnDetailsPage,
});
