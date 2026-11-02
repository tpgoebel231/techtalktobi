import { createFileRoute } from "@tanstack/react-router";
import { LegalPageDe } from "@/pages/legal-de";
import { datenschutzDe } from "@/data/legal-de";
import { bonnHead, requireDe } from "@/lib/bonn-route";

// Placeholders in src/data/legal-de.ts must be filled by Tobias before this
// ships. scripts/check-legal-placeholders.mjs enforces that.
export const Route = createFileRoute("/$locale/datenschutz")({
  beforeLoad: ({ params }) => requireDe(params.locale, "/$locale/datenschutz"),
  head: () => bonnHead(`${datenschutzDe.title} · TechTalkTobi`, datenschutzDe.description),
  component: () => <LegalPageDe page={datenschutzDe} />,
});
