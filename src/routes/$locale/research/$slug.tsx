import { createFileRoute, notFound } from "@tanstack/react-router";
import { getResearch, isResearchSlug } from "@/data/research";
import { ResearchDetailPage } from "@/pages/research-detail";

export const Route = createFileRoute("/$locale/research/$slug")({
  beforeLoad: ({ params }) => {
    if (!isResearchSlug(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const piece = getResearch(params.slug);
    const title =
      params.locale === "de" ? piece?.title.de : piece?.title.en;
    return {
      meta: [{ title: `${title ?? "Research"} · TechTalkTobi` }],
    };
  },
  component: ResearchDetailRoute,
});

function ResearchDetailRoute() {
  const { slug } = Route.useParams();
  if (!isResearchSlug(slug)) throw notFound();
  return <ResearchDetailPage slug={slug} />;
}
