import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  isResearchCategorySlug,
  researchCategoryDescription,
  researchCategoryTitle,
} from "@/data/research";
import { ResearchCategoryPage } from "@/pages/research-category";

export const Route = createFileRoute("/$locale/research/topics/$topic")({
  beforeLoad: ({ params }) => {
    if (!isResearchCategorySlug(params.topic)) throw notFound();
  },
  head: ({ params }) => {
    const locale = params.locale === "de" ? "de" : "en";
    if (!isResearchCategorySlug(params.topic)) {
      return { meta: [{ title: "Research · TechTalkTobi" }] };
    }
    return {
      meta: [
        { title: researchCategoryTitle(params.topic, locale) },
        { name: "description", content: researchCategoryDescription(params.topic, locale) },
      ],
    };
  },
  component: ResearchCategoryRoute,
});

function ResearchCategoryRoute() {
  const { topic } = Route.useParams();
  if (!isResearchCategorySlug(topic)) throw notFound();
  return <ResearchCategoryPage slug={topic} />;
}
