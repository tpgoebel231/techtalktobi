import { createFileRoute } from "@tanstack/react-router";
import { LegalPageDe } from "@/pages/legal-de";
import { datenschutzDe } from "@/data/legal-de";
import { bonnHead, requireDe } from "@/lib/bonn-route";

// scripts/check-legal-placeholders.mjs keeps [placeholders] out of
// src/data/legal-de.ts.
export const Route = createFileRoute("/$locale/datenschutz")({
  beforeLoad: ({ params }) => requireDe(params.locale, "/$locale/datenschutz"),
  head: () => bonnHead(`${datenschutzDe.title} · TechTalkTobi`, datenschutzDe.description),
  component: () => <LegalPageDe page={datenschutzDe} />,
});
