import { createFileRoute, notFound } from "@tanstack/react-router";
import { getResearch, isResearchSlug } from "@/data/research";
import { ResearchDetailPage } from "@/pages/research-detail";

export const Route = createFileRoute("/$locale/research/$slug")({
  beforeLoad: ({ params }) => {
    if (!isResearchSlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const piece = getResearch(params.slug);
    const locale = params.locale === "de" ? "de" : "en";
    const title = piece?.title[locale];
    const description = piece?.dek[locale];
    return {
      meta: [
        { title: `${title ?? "Research"} · TechTalkTobi` },
        ...(description ? [{ name: "description", content: description }] : []),
      ],
    };
  },
  component: ResearchDetailRoute,
});

function ResearchDetailRoute() {
  const { slug } = Route.useParams();
  if (!isResearchSlug(slug)) throw notFound();
  return <ResearchDetailPage slug={slug} />;
}
