import { createFileRoute } from "@tanstack/react-router";
import { LiveInBonnPage } from "@/pages/live-in-bonn";
import { bonnHead, requireDe } from "@/lib/bonn-route";

// Indexable (no noindex), but not linked from nav or sitemap yet.
// See LIVE_IN_BONN_LISTED in src/lib/clean-routes.ts.
export const Route = createFileRoute("/$locale/live-in-bonn")({
  beforeLoad: ({ params }) => requireDe(params.locale, "/$locale/live-in-bonn"),
  head: () =>
    bonnHead(
      "Live in Bonn · TeslaTobi Stammtisch",
      "Der erste TeslaTobi Stammtisch zum Anfassen: Samstag, 19.12.2026, ab 18 Uhr in Bonn. Eckdaten und Termin.",
    ),
  component: LiveInBonnPage,
});
